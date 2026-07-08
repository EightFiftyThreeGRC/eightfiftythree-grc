// js/assets-csf-phase2.js — Phase 2: map SSP attestations to CSF subcategories

if (typeof getAssetSSPControls === 'function') {
  getAssetSSPControls = function(asset) {
    if (typeof getActiveSubcategories !== 'function') return [];
    return getActiveSubcategories().map(function(s) {
      return { id: s.id, f: s.fn, cat: s.cat, n: s.n };
    });
  };
}

if (typeof getProcessSSPControls === 'function') {
  getProcessSSPControls = function(proc) {
    return typeof getAssetSSPControls === 'function' ? getAssetSSPControls(proc) : [];
  };
}

function getSspLabel() {
  return 'Implementation attestation';
}
