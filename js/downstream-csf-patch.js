// js/downstream-csf-patch.js — hub, reports, assets Phase 1 stubs

if (typeof renderAuthorizationStatusPanelHtml === 'function') {
  renderAuthorizationStatusPanelHtml = function() { return ''; };
}

if (typeof openAtoDecisionModal === 'function') {
  var _origOpenAto = openAtoDecisionModal;
  openAtoDecisionModal = function() {
    showToast('Authorization decisions are being adapted for CSF in a future release.', true);
  };
}

function renderAssetTabCsfBanner() {
  var panel = document.getElementById('tab-asset');
  if (!panel) return;
  var existing = document.getElementById('csf-asset-phase2-banner');
  if (existing) return;
  var banner = document.createElement('div');
  banner.id = 'csf-asset-phase2-banner';
  banner.className = 'info-alert';
  banner.style.margin = '0 0 16px 0';
  banner.innerHTML = '<div class="ia-icon">ℹ️</div><div class="ia-text"><strong>Asset attestations — CSF mapping coming soon.</strong> SSP workflows still reference legacy control mappings; subcategory attestations will arrive in Phase 2.</div>';
  var first = panel.querySelector('.wizard-step.active') || panel.firstElementChild;
  if (first && first.parentNode) first.parentNode.insertBefore(banner, first);
}

if (typeof renderAssetTab === 'function') {
  var _origRenderAssetTab = renderAssetTab;
  renderAssetTab = function() {
    _origRenderAssetTab();
    setTimeout(renderAssetTabCsfBanner, 0);
  };
}

if (typeof renderHomeTab === 'function') {
  var _origRenderHomeTab = renderHomeTab;
  renderHomeTab = function() {
    _origRenderHomeTab();
    var baselinePills = document.querySelectorAll('[data-baseline-pill]');
    baselinePills.forEach(function(el) { el.style.display = 'none'; });
  };
}

if (typeof isPm4InScope === 'function') {
  isPm4InScope = function() { return true; };
}

function getProgramBaselineLabel() {
  var n = getActiveCategories().length;
  return n + ' categor' + (n === 1 ? 'y' : 'ies') + ' in scope';
}

function getProgramBaselineFipsLetter() {
  return null;
}

function baselineCount() {
  return getActiveSubcategories().length;
}
