// js/controls-csf-patch.js — CSF adaptations for subcategory implementation wizard

function csfScopeGateHtml() {
  return '<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">Program setup required</div><p>Complete category scope in program setup to load subcategories.</p></div>';
}

function getControlLibraryFamilies() {
  var subs = getActiveSubcategories();
  if (state._controlLibraryFamilyFilter && state._controlLibraryFamilyFilter.indexOf('.') !== -1) {
    var cats = {};
    subs.forEach(function(s) { cats[s.cat] = true; });
    return Object.keys(cats).sort();
  }
  var fns = {};
  subs.forEach(function(s) { fns[s.fn] = true; });
  return Object.keys(fns).sort();
}

function familyFilterLabel(f) {
  if (f.indexOf('.') !== -1) {
    var cat = typeof getCategoryById === 'function' ? getCategoryById(f) : null;
    return cat ? f + ' — ' + cat.name : f;
  }
  return f + ' — ' + ((FUNCTIONS && FUNCTIONS[f]) || f);
}

function controlMatchesFamilyFilter(c, familyFilter) {
  if (!familyFilter) return true;
  if (familyFilter.indexOf('.') !== -1) return c.cat === familyFilter;
  return c.f === familyFilter || c.fn === familyFilter;
}

if (typeof renderControlLibrary === 'function') {
  var _origRenderControlLibrary = renderControlLibrary;
  renderControlLibrary = function() {
    var body = document.getElementById('control-library-body') || document.getElementById('tab-control');
    if (!getProgramScopeReady()) {
      if (body) body.innerHTML = csfScopeGateHtml();
      return;
    }
    return _origRenderControlLibrary();
  };
}

if (typeof renderControlWorkspace === 'function') {
  var _origRenderControlWorkspace = renderControlWorkspace;
  renderControlWorkspace = function() {
    var body = document.getElementById('control-workspace-body');
    if (!getProgramScopeReady()) {
      if (body) body.innerHTML = csfScopeGateHtml();
      return;
    }
    return _origRenderControlWorkspace();
  };
}

// Strip baseline gate in renderControlTab entry
if (typeof renderControlTab === 'function') {
  var _origRenderControlTab = renderControlTab;
  renderControlTab = function() {
    if (!getProgramScopeReady() && !state._controlLibraryMode) {
      var panel = document.getElementById('tab-control');
      if (panel) {
        var body = panel.querySelector('.control-tab-body') || panel;
        if (body && !state._controlLibraryMode) body.innerHTML = csfScopeGateHtml();
      }
    }
    return _origRenderControlTab();
  };
}

function getSubcategoryDisplayName(id) {
  var sub = typeof getSubcategoryById === 'function' ? getSubcategoryById(id) : null;
  return sub ? sub.id + ' — ' + sub.n : id;
}
