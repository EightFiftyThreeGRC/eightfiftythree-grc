// js/hub.js — Command Center (post-setup home dashboard)

function getSetupProgressSummary() {
  var step = (typeof currentStep !== 'undefined' && currentStep.ciso) ? currentStep.ciso : 1;
  var pct = Math.round((step / 7) * 100);
  var labels = ['Organization', 'Baseline', 'Reg mapping', 'PM Controls', 'InfoSec Policy', 'Consolidate', 'Assign Owners'];
  return { step: step, pct: pct, label: labels[step - 1] || 'Organization' };
}

function startProgramSetup() {
  showTab('ciso');
  goToStep('ciso', 1);
}

function renderOnboardingHome() {
  var body = document.getElementById('home-body');
  var pageHeader = document.querySelector('#tab-home .page-header');
  if (pageHeader) {
    pageHeader.style.display = '';
    var title = document.getElementById('home-page-title');
    var subtitle = document.getElementById('home-page-subtitle');
    if (title) title.textContent = 'Welcome — let\u2019s set up your program';
    if (subtitle) subtitle.textContent = 'Seven short steps to stand up NIST 800-53. You can return here anytime from Command Center.';
  }
  if (!body) return;

  var progress = getSetupProgressSummary();
  var hasStarted = !!(String(state.orgName || '').trim() || String(state.programOwner || '').trim() || state.baseline);

  var steps = [
    { n: 1, label: 'Organization' },
    { n: 2, label: 'Baseline' },
    { n: 3, label: 'Reg mapping' },
    { n: 4, label: 'PM controls' },
    { n: 5, label: 'InfoSec policy' },
    { n: 6, label: 'Consolidate' },
    { n: 7, label: 'Assign owners' }
  ];

  var stepChips = steps.map(function(s) {
    var done = s.n < progress.step;
    var current = s.n === progress.step;
    var cls = 'onboard-step-chip' + (done ? ' done' : '') + (current ? ' current' : '');
    return '<span class="' + cls + '"><span class="onboard-step-num">' + (done ? '✓' : s.n) + '</span>' + escapeHTML(s.label) + '</span>';
  }).join('');

  body.innerHTML = ''
    + '<div class="onboard-hero">'
    + '<p class="onboard-eyebrow">EightFiftyThree GRC</p>'
    + '<h2 class="onboard-title">NIST 800-53.<br>Without the spreadsheet.</h2>'
    + '<p class="onboard-lead">The landing page got you here — now let\'s stand up your program in <strong>seven short steps</strong>. One screen at a time, no overwhelm.</p>'
    + '<div class="onboard-step-rail">' + stepChips + '</div>'
    + '<div class="onboard-actions">'
    + '<button type="button" class="btn btn-primary onboard-cta" onclick="startProgramSetup()">' + (hasStarted ? 'Continue setup' : 'Start program setup') + '</button>'
    + '<button type="button" class="btn btn-secondary" onclick="openWizardVideo(\'assets/videos/01-program-setup.mp4\', \'Program setup walkthrough\')">▶ Watch walkthrough</button>'
    + '</div>'
    + (hasStarted
      ? '<p class="onboard-resume">You\'re on step ' + progress.step + ' — <strong>' + escapeHTML(progress.label) + '</strong>. Pick up where you left off.</p>'
      : '<p class="onboard-resume">Most teams finish setup in 15–20 minutes. Step 3 maps ISO, SOC 2, CIS, and sector-specific laws.</p>')
    + '</div>'
    + '<div class="onboard-features">'
    + '<div class="onboard-feature"><span>📋</span><div><strong>Policies</strong><p>Build AC, AU, SC, and the rest after setup.</p></div></div>'
    + '<div class="onboard-feature"><span>🔧</span><div><strong>Controls</strong><p>Design obligations and link SharePoint evidence.</p></div></div>'
    + '<div class="onboard-feature"><span>🖥️</span><div><strong>Assets &amp; SSP</strong><p>Inventory systems and submit attestation packages.</p></div></div>'
    + '</div>';
}

function getNextActions() {
  var actions = [];
  var today = new Date().toISOString().slice(0, 10);

  if (!state.cisoComplete) {
    var p = getSetupProgressSummary();
    actions.push({ priority: 1, icon: '🏛️', label: 'Continue program setup', desc: 'Step ' + p.step + ' of 7 — ' + p.label + '.', action: "startProgramSetup();" });
    return actions;
  }

  var polReview = (state.policyStatus || {});
  Object.keys(polReview).forEach(function(fam) {
    var st = (polReview[fam] || {}).status;
    if (st === 'Submitted' || st === 'In Review') {
      actions.push({ priority: 2, icon: '📋', label: 'Review policy: ' + fam, desc: 'Domain policy awaiting CISO approval.', action: "openCISOReview('" + fam.replace(/'/g, "\\'") + "');" });
    }
  });

  (state.controlReviewQueue || []).slice(0, 5).forEach(function(r) {
    if (!r || !r.controlId) return;
    actions.push({ priority: 3, icon: '🔧', label: 'Review control: ' + r.controlId, desc: (r.status || 'Pending review'), action: "state._selectedCtrl='" + r.controlId.replace(/'/g, "\\'") + "';showTab('control');goToStep('control',2);" });
  });

  (state.poamItems || []).forEach(function(p) {
    if (p.dueDate && p.dueDate < today && p.status !== 'Closed' && p.status !== 'Mitigated') {
      actions.push({ priority: 0, icon: '⚠️', label: 'Overdue POA&M', desc: p.finding.slice(0, 60), action: "showTab('poam');" });
    }
  });

  if (typeof getISPStatus === 'function' && getISPStatus() === 'Under Review') {
    var ispTitle = ((state.infoSecPolicy && state.infoSecPolicy.title) ? String(state.infoSecPolicy.title).trim() : '')
      || (typeof getDefaultISPTitle === 'function' ? getDefaultISPTitle() : 'Information Security Policy');
    var ispCanApprove = typeof canSessionApproveISP === 'function' && canSessionApproveISP();
    var ispIsApproverRole = false;
    if (state.currentUserId && state.users) {
      (state._currentPersonIds || [state.currentUserId]).forEach(function(pid) {
        var rec = state.users.find(function(u) { return u.id === pid; });
        if (rec && rec.role === 'approver') ispIsApproverRole = true;
      });
    }
    if (ispCanApprove || ispIsApproverRole) {
      actions.push({
        priority: 0,
        icon: '✅',
        label: 'Approve ISP: ' + ispTitle,
        desc: 'Tier 1 Information Security Policy is awaiting your sign-off.',
        action: "showTab('reports');goToCISOPolicyEditor();"
      });
    }
  }

  if (typeof canSessionReviseReturnedISP === 'function' && canSessionReviseReturnedISP()) {
    var returnedIspTitle = ((state.infoSecPolicy && state.infoSecPolicy.title) ? String(state.infoSecPolicy.title).trim() : '')
      || (typeof getDefaultISPTitle === 'function' ? getDefaultISPTitle() : 'Information Security Policy');
    var returnedNotes = String(((state.policyStatus || {}).ISP || {}).notes || '').trim();
    var returnedDesc = returnedNotes
      ? 'Returned with comments: ' + returnedNotes.slice(0, 80) + (returnedNotes.length > 80 ? '\u2026' : '')
      : 'Tier 1 Information Security Policy was returned for your revision.';
    actions.push({
      priority: 0,
      icon: '\u21A9',
      label: 'Revise ISP: ' + returnedIspTitle,
      desc: returnedDesc,
      action: 'goToCISOPolicyEditor();'
    });
  }

  (state.assets || []).forEach(function(a) {
    var signoff = (state.sspSignoffs || {})[a.id] || {};
    if (signoff.status === 'Submitted') {
      actions.push({ priority: 4, icon: '🖥️', label: 'SSP submitted: ' + a.name, desc: 'Review asset package on Reports.', action: "showTab('reports');" });
    }
  });

  actions.sort(function(a, b) { return a.priority - b.priority; });
  return actions.slice(0, 8);
}

function updateCommandCenterPageHeader() {
  var subtitle = document.getElementById('home-page-subtitle');
  if (!subtitle || !state.cisoComplete) return;
  var org = (state.orgName || '').trim() || 'Your organization';
  var baseline = state.baseline ? (state.baseline === 'L' ? 'Low' : state.baseline === 'M' ? 'Moderate' : 'High') : '—';
  subtitle.textContent = org + ' · ' + baseline + ' baseline · posture and next actions';
}

function renderHomeTab() {
  var body = document.getElementById('home-body');
  if (!body) return;

  if (!state.cisoComplete) {
    renderOnboardingHome();
    return;
  }

  var pageHeader = document.querySelector('#tab-home .page-header');
  if (pageHeader) pageHeader.style.display = '';
  updateCommandCenterPageHeader();

  var ctrlTotal = typeof getActiveControls === 'function' ? getActiveControls().length : 0;
  var implemented = 0;
  if (typeof getActiveControls === 'function') {
    getActiveControls().forEach(function(c) {
      var st = (state.controlStatus || {})[c.id];
      if (st && (st.status === 'Implemented' || st.status === 'Inherited')) implemented++;
    });
  }
  var implPct = ctrlTotal ? Math.round((implemented / ctrlTotal) * 100) : 0;
  var ownerCount = countUniquePolicyOwnerEmails();
  var domainsAssigned = countAssignedPolicyDomains();
  var domainTotal = getMasterPolicyFamilies().length;
  var actions = getNextActions();

  var actionHtml = actions.length
    ? actions.map(function(a) {
      return '<button type="button" class="hub-action-card" onclick="' + a.action + '">'
        + '<span class="hub-action-icon">' + a.icon + '</span>'
        + '<div><div class="hub-action-label">' + escapeHTML(a.label) + '</div>'
        + '<div class="hub-action-desc">' + escapeHTML(a.desc) + '</div></div>'
        + '<span class="hub-action-arrow">→</span></button>';
    }).join('')
    : '<div class="hub-empty-actions">You\'re caught up — open a workspace from the sidebar or the cards below.</div>';

  var workspaces = [
    { icon: '📋', label: 'Policies', desc: 'Domain policy builder & catalog', fn: 'goToPoliciesHome()' },
    { icon: '🔧', label: 'Controls', desc: 'Implementation design', fn: 'goToControlWorkspace()' },
    { icon: '🖥️', label: 'Assets & SSP', desc: 'Inventory & attestations', fn: 'goToAssetWorkspace()' },
    { icon: '📊', label: 'Reports', desc: 'Program dashboard', fn: "showTab('reports')" },
    { icon: '◇', label: 'Frameworks', desc: 'ISO / SOC 2 / CIS', fn: "showTab('frameworks')" },
    { icon: '📝', label: 'POA&M', desc: 'Findings & remediation', fn: "showTab('poam')" }
  ];

  body.innerHTML = ''
    + '<div class="hub-dashboard">'
    + '<div class="hub-kpi-grid">'
    + '<div class="hub-kpi"><div class="hub-kpi-val">' + implPct + '%</div><div class="hub-kpi-label">Controls implemented</div><div class="hub-kpi-sub">' + implemented + ' / ' + ctrlTotal + '</div></div>'
    + '<div class="hub-kpi"><div class="hub-kpi-val">' + ownerCount + '</div><div class="hub-kpi-label">Policy owners</div><div class="hub-kpi-sub">' + domainsAssigned + ' / ' + domainTotal + ' domains rostered</div></div>'
    + '<div class="hub-kpi"><div class="hub-kpi-val">' + (state.assets || []).length + '</div><div class="hub-kpi-label">Assets in inventory</div></div>'
    + '<div class="hub-kpi"><div class="hub-kpi-val">' + getPoamOpenCount() + '</div><div class="hub-kpi-label">Open POA&amp;M items</div></div>'
    + '</div>'
    + (typeof renderFrameworkDashboardStripHtml === 'function' ? renderFrameworkDashboardStripHtml() : '')
    + '<div class="hub-lower-grid">'
    + '<div class="hub-section hub-section-card"><h3 class="hub-section-title">Your next actions</h3><div class="hub-actions">' + actionHtml + '</div></div>'
    + '<div class="hub-section hub-section-card"><h3 class="hub-section-title">Workspaces</h3><div class="hub-workspace-grid">'
    + workspaces.map(function(w) {
      return '<button type="button" class="hub-workspace-card" onclick="' + w.fn + '">'
        + '<span class="hub-workspace-icon">' + w.icon + '</span>'
        + '<span class="hub-workspace-label">' + escapeHTML(w.label) + '</span>'
        + '<span class="hub-workspace-desc">' + escapeHTML(w.desc) + '</span></button>';
    }).join('')
    + '</div></div>'
    + '</div>'
    + (typeof renderPoamSummaryHtml === 'function' ? renderPoamSummaryHtml() : '')
    + '</div>';
}
