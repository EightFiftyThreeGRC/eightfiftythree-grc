// js/policies-csf-patch.js — CSF adaptations for domain policies wizard

function getDomainPolicySelectableControls(allFams) {
  if (state.policyStructure === 'function') {
    return getActiveSubcategories().filter(function(s) {
      return allFams.indexOf(s.fn) !== -1;
    }).map(function(s) {
      return { id: s.id, f: s.fn, cat: s.cat, n: s.n };
    });
  }
  return getActiveSubcategories().filter(function(s) {
    return allFams.indexOf(s.cat) !== -1;
  }).map(function(s) {
    return { id: s.id, f: s.fn, cat: s.cat, n: s.n };
  });
}

function getPolicyAllFamilies(fam) {
  return getPolicyAllUnits(fam);
}

function policyUnitDefaultTitle(unit) {
  if (state.policyStructure === 'function') {
    return (FUNCTIONS && FUNCTIONS[unit]) ? FUNCTIONS[unit] + ' Policy' : unit + ' Policy';
  }
  var cat = typeof getCategoryById === 'function' ? getCategoryById(unit) : null;
  return cat ? cat.name + ' Policy' : unit + ' Policy';
}

function getPolicyMergedTitle(fam) {
  if (state.domainCustomNames && state.domainCustomNames[fam]) return state.domainCustomNames[fam];
  var merges = state.policyMerges || {};
  var slaves = Object.keys(merges).filter(function(k) { return merges[k] === fam; });
  if (slaves.length) {
    var preset = (typeof COMMON_CATEGORY_MERGES !== 'undefined' ? COMMON_CATEGORY_MERGES : []).find(function(m) {
      return m.master === fam && m.slaves && m.slaves.length === slaves.length && m.slaves.every(function(s) { return slaves.indexOf(s) !== -1; });
    });
    if (preset) return preset.label;
  }
  return policyUnitDefaultTitle(fam);
}

function ctrlShortDesc(ctrlId) {
  var t = (typeof CSF_SUBCATEGORY_TEXT !== 'undefined' && CSF_SUBCATEGORY_TEXT[ctrlId]) || '';
  if (t) return t.length > 200 ? t.slice(0, 197) + '…' : t;
  var sub = typeof getSubcategoryById === 'function' ? getSubcategoryById(ctrlId) : null;
  return sub ? sub.n : ctrlId;
}

function generateDomainPolicyObjective(ctrlId) {
  return (CSF_SUBCATEGORY_TEXT && CSF_SUBCATEGORY_TEXT[ctrlId]) || ctrlShortDesc(ctrlId);
}

// Extend DOMAIN_DEFAULTS lookup for CSF units
var _origDomainDefaultsLookup = function(fam) {
  return DOMAIN_DEFAULTS[fam] || DOMAIN_DEFAULT_GENERIC;
};

function getDomainDefaultsForUnit(fam) {
  var title = getPolicyMergedTitle(fam);
  var fn = state.policyStructure === 'function' ? fam : (fam.split('.')[0] || fam);
  var desc = (FUNCTION_DESC && FUNCTION_DESC[fn]) || (CATEGORY_DESC && CATEGORY_DESC[fam]) || '';
  return {
    title: title,
    purpose: 'This policy defines how ' + (state.orgName || 'the organization') + ' achieves CSF outcomes for ' + title + '.',
    scope: desc || 'All systems, personnel, and third parties within the scope of this policy unit.'
  };
}

// Patch initDomainPolicy to use CSF defaults when DOMAIN_DEFAULTS lacks fam key
if (typeof initDomainPolicy === 'function') {
  var _origInitDomainPolicy = initDomainPolicy;
  initDomainPolicy = function(fam) {
    if (!DOMAIN_DEFAULTS[fam]) {
      var dd = getDomainDefaultsForUnit(fam);
      DOMAIN_DEFAULTS[fam] = dd;
    }
    return _origInitDomainPolicy(fam);
  };
}
