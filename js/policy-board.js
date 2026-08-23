// js/policy-board.js — shared CSF Function / 800-53 family grouping board.
// Globals only. Load after program.js. Used by Path A Consolidate and Path B Policy set.
// Persistence: state.policyMerges (document membership) + state.policyFamilyHome
// (sparse Function/standalone override). No second grouping system.

var POLICY_BOARD_FNS = ['ID', 'PR', 'DE', 'RS', 'RC'];
var _policyBoardDrag = null;
var _policyBoardMenu = null;

function policyBoardFnName(fn) {
  if (typeof CSF_FUNCTIONS !== 'undefined' && CSF_FUNCTIONS[fn]) return CSF_FUNCTIONS[fn].name;
  return fn;
}

function policyBoardDefaultFn(fam) {
  if (fam === 'PM') return 'GV';
  if (typeof getCsfFamilyPolicyFunction === 'function') return getCsfFamilyPolicyFunction(fam) || '';
  return '';
}

function policyBoardDefaultMaster(fn) {
  if (typeof NIST_CSF_FUNCTION_POLICY_MASTER !== 'undefined') {
    return NIST_CSF_FUNCTION_POLICY_MASTER[fn] || '';
  }
  return '';
}

function policyBoardActiveFamilies() {
  return (typeof getActiveFamilies === 'function' ? getActiveFamilies() : []).filter(function(f) {
    return f && f !== 'PM';
  });
}

function policyBoardMergeRoot(fam) {
  var merges = (state && state.policyMerges) || {};
  var seen = {};
  var cur = fam;
  while (cur && merges[cur] && !seen[cur]) {
    seen[cur] = true;
    cur = merges[cur];
  }
  return cur;
}

function getFamilyPolicyHome(fam) {
  if (fam === 'PM') return 'GV';
  var over = state.policyFamilyHome && state.policyFamilyHome[fam];
  if (over === 'standalone') return 'standalone';
  if (over && over !== 'GV' && POLICY_BOARD_FNS.indexOf(over) !== -1) return over;
  var def = policyBoardDefaultFn(fam);
  if (def === 'GV') return 'GV';
  if (POLICY_BOARD_FNS.indexOf(def) !== -1) return def;
  return 'standalone';
}

function policyBoardCoercePartition() {
  if (!state.policyMerges || typeof state.policyMerges !== 'object') state.policyMerges = {};
  if (!state.policyFamilyHome || typeof state.policyFamilyHome !== 'object') state.policyFamilyHome = {};
  delete state.policyMerges.PM;
  delete state.policyMerges.GV;
  delete state.policyFamilyHome.PM;
  Object.keys(state.policyMerges).forEach(function(f) {
    var t = state.policyMerges[f];
    if (f === 'PM' || f === 'GV' || t === 'PM' || t === 'GV' || !t) delete state.policyMerges[f];
  });
  Object.keys(state.policyFamilyHome).forEach(function(f) {
    if (f === 'PM' || state.policyFamilyHome[f] === 'GV') delete state.policyFamilyHome[f];
  });
  policyBoardActiveFamilies().forEach(function(f) {
    var root = policyBoardMergeRoot(f);
    if (!root || root === 'PM') {
      delete state.policyMerges[f];
      return;
    }
    if (root !== f) state.policyMerges[f] = root;
    else delete state.policyMerges[f];
  });
}

function getPolicyBoardDocuments() {
  if (typeof ensureCsfFunctionGrouping === 'function') ensureCsfFunctionGrouping();
  policyBoardCoercePartition();
  var families = policyBoardActiveFamilies();
  var buckets = {};
  var order = [];
  families.forEach(function(f) {
    var root = policyBoardMergeRoot(f);
    if (!root || root === 'PM') return;
    if (!buckets[root]) {
      buckets[root] = [];
      order.push(root);
    }
    if (buckets[root].indexOf(f) === -1) buckets[root].push(f);
  });

  var docs = [];
  var claimedFns = {};
  order.forEach(function(root) {
    var fams = buckets[root].slice();
    fams.sort();
    var fnSet = {};
    fams.forEach(function(f) {
      var home = getFamilyPolicyHome(f);
      if (POLICY_BOARD_FNS.indexOf(home) !== -1) fnSet[home] = true;
    });
    POLICY_BOARD_FNS.forEach(function(fn) {
      var dm = policyBoardDefaultMaster(fn);
      if (dm && fams.indexOf(dm) !== -1) fnSet[fn] = true;
    });
    var fnIds = POLICY_BOARD_FNS.filter(function(fn) { return fnSet[fn]; });
    fnIds.forEach(function(fn) { claimedFns[fn] = true; });
    var standalone = fnIds.length === 0;
    var combined = fnIds.length > 1;
    var primary = fnIds.length === 1 ? fnIds[0] : (fnIds[0] || '');
    var custom = (state.domainCustomNames && state.domainCustomNames[root]) || '';
    var title = custom;
    if (!title) {
      if (combined) title = fnIds.map(policyBoardFnName).join(' & ');
      else if (primary) title = policyBoardFnName(primary);
      else title = (typeof FAMILIES !== 'undefined' && FAMILIES[root]) ? FAMILIES[root] : root;
    }
    docs.push({
      master: root,
      fn: primary,
      fnIds: fnIds,
      title: title,
      families: fams,
      combined: combined,
      standalone: standalone,
      empty: false,
      slot: root
    });
  });

  docs.sort(function(a, b) {
    var ai = a.standalone ? 100 : (a.fnIds[0] ? POLICY_BOARD_FNS.indexOf(a.fnIds[0]) : 99);
    var bi = b.standalone ? 100 : (b.fnIds[0] ? POLICY_BOARD_FNS.indexOf(b.fnIds[0]) : 99);
    if (ai !== bi) return ai - bi;
    return String(a.master).localeCompare(String(b.master));
  });

  var emptyFns = [];
  POLICY_BOARD_FNS.forEach(function(fn) {
    if (claimedFns[fn]) return;
    emptyFns.push({
      master: '',
      fn: fn,
      fnIds: [fn],
      title: policyBoardFnName(fn),
      families: [],
      combined: false,
      standalone: false,
      empty: true,
      slot: 'fn:' + fn
    });
  });

  return { docs: docs, emptyFns: emptyFns };
}

function policyBoardReconcileSelectedControls(fam, fromMaster) {
  if (!state.policySelectedControls || !fromMaster || fromMaster === fam) return;
  var src = state.policySelectedControls[fromMaster];
  if (!Array.isArray(src) || !src.length) return;
  var prefix = fam + '-';
  var keep = [];
  var move = [];
  src.forEach(function(id) {
    if (String(id).indexOf(prefix) === 0) move.push(id);
    else keep.push(id);
  });
  if (!move.length) return;
  state.policySelectedControls[fromMaster] = keep;
  var dest = state.policySelectedControls[fam];
  if (!Array.isArray(dest)) dest = [];
  move.forEach(function(id) {
    if (dest.indexOf(id) === -1) dest.push(id);
  });
  state.policySelectedControls[fam] = dest;
}

function policyBoardPromoteIfMaster(fam) {
  var merges = state.policyMerges || {};
  if (merges[fam]) return;
  var slaves = policyBoardActiveFamilies().filter(function(f) { return merges[f] === fam; });
  if (!slaves.length) return;
  var newMaster = slaves[0];
  slaves.slice(1).forEach(function(sf) { state.policyMerges[sf] = newMaster; });
  delete state.policyMerges[newMaster];
  if (state.domainCustomNames && state.domainCustomNames[fam] && !state.domainCustomNames[newMaster]) {
    state.domainCustomNames[newMaster] = state.domainCustomNames[fam];
  }
}

function policyBoardSilentMerge(slave, master) {
  if (typeof mergePolicy === 'function') mergePolicy(slave, master, { silent: true });
  else {
    if (!state.policyMerges) state.policyMerges = {};
    Object.keys(state.policyMerges).forEach(function(f) {
      if (state.policyMerges[f] === slave) state.policyMerges[f] = master;
    });
    state.policyMerges[slave] = master;
  }
}

function policyBoardMoveFamilyToSlot(fam, slot) {
  fam = String(fam || '').toUpperCase();
  slot = String(slot || '');
  if (!fam || fam === 'PM') return false;
  if (slot === 'GV' || slot === 'fn:GV' || slot === 'PM' || slot === 'fn:PM') return false;
  var families = policyBoardActiveFamilies();
  if (families.indexOf(fam) === -1) return false;
  var currentRoot = policyBoardMergeRoot(fam);
  if (slot === currentRoot) return false;

  policyBoardPromoteIfMaster(fam);
  policyBoardReconcileSelectedControls(fam, currentRoot);

  if (!state.policyFamilyHome) state.policyFamilyHome = {};
  if (!state.policyMerges) state.policyMerges = {};
  if (!state.domainCustomNames) state.domainCustomNames = {};

  if (slot === 'standalone') {
    state.policyFamilyHome[fam] = 'standalone';
    delete state.policyMerges[fam];
  } else if (slot.indexOf('fn:') === 0) {
    var fn = slot.slice(3).toUpperCase();
    if (POLICY_BOARD_FNS.indexOf(fn) === -1) return false;
    state.policyFamilyHome[fam] = fn;
    delete state.policyMerges[fam];
    state.domainCustomNames[fam] = policyBoardFnName(fn);
  } else {
    var targetHome = getFamilyPolicyHome(slot);
    if (targetHome === 'GV') return false;
    if (POLICY_BOARD_FNS.indexOf(targetHome) !== -1) state.policyFamilyHome[fam] = targetHome;
    else state.policyFamilyHome[fam] = 'standalone';
    policyBoardSilentMerge(fam, slot);
  }
  policyBoardCoercePartition();
  if (typeof markDirty === 'function') markDirty();
  try { addAuditEntry('program', null, 'Moved family ' + fam + ' to ' + slot); } catch (e) { /* ignore */ }
  return true;
}

function policyBoardMergeDocs(srcMaster, dstMaster) {
  srcMaster = String(srcMaster || '').toUpperCase();
  dstMaster = String(dstMaster || '').toUpperCase();
  if (!srcMaster || !dstMaster || srcMaster === dstMaster) return false;
  if (srcMaster === 'PM' || dstMaster === 'PM') return false;
  var srcFams = policyBoardActiveFamilies().filter(function(f) {
    return policyBoardMergeRoot(f) === srcMaster;
  });
  if (!srcFams.length) return false;
  srcFams.forEach(function(f) {
    if (f === dstMaster) return;
    policyBoardSilentMerge(f, dstMaster);
  });
  var names = [];
  function addName(fn) {
    if (POLICY_BOARD_FNS.indexOf(fn) === -1) return;
    var n = policyBoardFnName(fn);
    if (names.indexOf(n) === -1) names.push(n);
  }
  addName(getFamilyPolicyHome(dstMaster));
  srcFams.forEach(function(f) { addName(getFamilyPolicyHome(f)); });
  POLICY_BOARD_FNS.forEach(function(fn) {
    var dm = policyBoardDefaultMaster(fn);
    if (dm === srcMaster || dm === dstMaster) addName(fn);
  });
  if (names.length > 1) {
    if (!state.domainCustomNames) state.domainCustomNames = {};
    state.domainCustomNames[dstMaster] = names.join(' & ');
  }
  policyBoardCoercePartition();
  if (typeof markDirty === 'function') markDirty();
  try { addAuditEntry('program', null, 'Merged policy documents ' + srcMaster + ' into ' + dstMaster); } catch (e) { /* ignore */ }
  return true;
}

function policyBoardSplitFn(fromMaster, fn) {
  fromMaster = String(fromMaster || '').toUpperCase();
  fn = String(fn || '').toUpperCase();
  if (!fromMaster || POLICY_BOARD_FNS.indexOf(fn) === -1) return false;
  var defMaster = policyBoardDefaultMaster(fn);
  var families = policyBoardActiveFamilies().filter(function(f) {
    return policyBoardMergeRoot(f) === fromMaster && getFamilyPolicyHome(f) === fn;
  });
  if (!families.length) return false;
  var newMaster = (defMaster && families.indexOf(defMaster) !== -1) ? defMaster : families[0];
  if (!state.policyMerges) state.policyMerges = {};
  if (!state.policyFamilyHome) state.policyFamilyHome = {};
  if (!state.domainCustomNames) state.domainCustomNames = {};
  families.forEach(function(f) {
    if (f === newMaster) delete state.policyMerges[f];
    else policyBoardSilentMerge(f, newMaster);
    state.policyFamilyHome[f] = fn;
  });
  state.domainCustomNames[newMaster] = policyBoardFnName(fn);
  var remainHome = getFamilyPolicyHome(fromMaster);
  if (POLICY_BOARD_FNS.indexOf(remainHome) !== -1) {
    state.domainCustomNames[fromMaster] = policyBoardFnName(remainHome);
  }
  policyBoardCoercePartition();
  if (typeof markDirty === 'function') markDirty();
  try { addAuditEntry('program', null, 'Split ' + policyBoardFnName(fn) + ' from ' + fromMaster); } catch (e) { /* ignore */ }
  return true;
}

function policyBoardRenameDoc(master, title) {
  master = String(master || '').toUpperCase();
  if (!master || master === 'PM') return;
  if (!state.domainCustomNames) state.domainCustomNames = {};
  title = String(title || '').trim();
  if (title) state.domainCustomNames[master] = title;
  else delete state.domainCustomNames[master];
  if (typeof markDirty === 'function') markDirty();
}

function policyBoardResetCsf() {
  if (typeof applyCsfFunctionGrouping === 'function') applyCsfFunctionGrouping({ replace: true });
  if (typeof showToast === 'function') {
    showToast('Reset to CSF 2.0 Function grouping (ISP + Identify / Protect / Detect / Respond / Recover).');
  }
}

function policyBoardRerender() {
  policyBoardCloseMenu();
  _policyBoardDrag = null;
  setTimeout(function() {
    var mapStep = parseInt(state && state.policyMapStep, 10) || 1;
    if (typeof shouldRenderPolicyMapSetup === 'function' && shouldRenderPolicyMapSetup() && mapStep === 6
        && typeof renderPolicyMapWizardBody === 'function') {
      renderPolicyMapWizardBody(6);
      return;
    }
    if (typeof renderActiveCisoSetupStep === 'function') renderActiveCisoSetupStep();
  }, 0);
}

function policyBoardApplyDrop(drag, slot) {
  if (!drag || !slot) return;
  var ok = false;
  if (drag.kind === 'fam') ok = policyBoardMoveFamilyToSlot(drag.id, slot);
  else if (drag.kind === 'doc') {
    if (slot === 'standalone' || slot.indexOf('fn:') === 0) return;
    ok = policyBoardMergeDocs(drag.id, slot);
  }
  if (ok) policyBoardRerender();
}

function policyBoardClearDragUi() {
  var nodes = document.querySelectorAll('.pgb-chip.is-dragging, .pgb-card-head.is-dragging, .pgb-card.is-drop-target, .pgb-well.is-drop-target');
  Array.prototype.forEach.call(nodes, function(el) { el.classList.remove('is-dragging', 'is-drop-target'); });
}

function policyBoardSetDropTarget(slotEl) {
  var nodes = document.querySelectorAll('.pgb-card.is-drop-target, .pgb-well.is-drop-target');
  Array.prototype.forEach.call(nodes, function(el) { el.classList.remove('is-drop-target'); });
  if (slotEl) slotEl.classList.add('is-drop-target');
}

function policyBoardCloseMenu() {
  if (_policyBoardMenu && _policyBoardMenu.parentNode) _policyBoardMenu.parentNode.removeChild(_policyBoardMenu);
  _policyBoardMenu = null;
}

function policyBoardOpenMenu(anchor, items) {
  policyBoardCloseMenu();
  if (!anchor || !items || !items.length) return;
  var menu = document.createElement('div');
  menu.id = 'policy-board-menu';
  menu.className = 'pgb-menu';
  menu.setAttribute('role', 'menu');
  items.forEach(function(it, idx) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pgb-menu-item';
    b.setAttribute('role', 'menuitem');
    b.textContent = it.label;
    b.tabIndex = idx === 0 ? 0 : -1;
    b.addEventListener('click', function(ev) {
      ev.preventDefault();
      policyBoardCloseMenu();
      setTimeout(function() {
        if (typeof it.run === 'function') it.run();
      }, 0);
    });
    menu.appendChild(b);
  });
  document.body.appendChild(menu);
  _policyBoardMenu = menu;
  var r = anchor.getBoundingClientRect();
  var mw = menu.offsetWidth || 220;
  var left = Math.min(r.left, window.innerWidth - mw - 8);
  if (left < 8) left = 8;
  var top = r.bottom + 4;
  if (top + menu.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - menu.offsetHeight - 4);
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  var buttons = menu.querySelectorAll('.pgb-menu-item');
  if (buttons[0]) buttons[0].focus();
  menu.addEventListener('keydown', function(ev) {
    var list = Array.prototype.slice.call(menu.querySelectorAll('.pgb-menu-item'));
    var i = list.indexOf(document.activeElement);
    if (ev.key === 'Escape') {
      ev.preventDefault();
      policyBoardCloseMenu();
      anchor.focus();
      return;
    }
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      list[(i + 1) % list.length].focus();
    }
    if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      list[(i - 1 + list.length) % list.length].focus();
    }
    if (ev.key === 'Home') { ev.preventDefault(); list[0].focus(); }
    if (ev.key === 'End') { ev.preventDefault(); list[list.length - 1].focus(); }
  });
}

function policyBoardMoveTargets(fam) {
  var model = getPolicyBoardDocuments();
  var current = policyBoardMergeRoot(fam);
  var items = [];
  model.docs.forEach(function(d) {
    if (d.master === current) return;
    items.push({
      label: 'Move to ' + d.title,
      run: function() {
        if (policyBoardMoveFamilyToSlot(fam, d.slot)) policyBoardRerender();
      }
    });
  });
  model.emptyFns.forEach(function(d) {
    items.push({
      label: 'Move to ' + d.title,
      run: function() {
        if (policyBoardMoveFamilyToSlot(fam, d.slot)) policyBoardRerender();
      }
    });
  });
  if (getFamilyPolicyHome(fam) !== 'standalone' || current !== fam) {
    items.push({
      label: 'Make its own document',
      run: function() {
        if (policyBoardMoveFamilyToSlot(fam, 'standalone')) policyBoardRerender();
      }
    });
  }
  return items;
}

function policyBoardMergeTargets(master) {
  var model = getPolicyBoardDocuments();
  var items = [];
  model.docs.forEach(function(d) {
    if (d.master === master || d.empty) return;
    items.push({
      label: 'Merge into ' + d.title,
      run: function() {
        if (policyBoardMergeDocs(master, d.master)) policyBoardRerender();
      }
    });
  });
  return items;
}

function policyBoardEnsureDelegates() {
  if (window._policyBoardDelegates) return;
  window._policyBoardDelegates = true;

  document.addEventListener('dragstart', function(ev) {
    if (!ev.target || !ev.target.closest) return;
    if (ev.target.closest('.pgb-menu-btn')) { ev.preventDefault(); return; }
    var chip = ev.target.closest('[data-pgb-fam][draggable="true"]');
    var head = ev.target.closest('[data-pgb-doc-handle]');
    var kind = '';
    var id = '';
    if (chip) {
      kind = 'fam';
      id = chip.getAttribute('data-pgb-fam') || '';
      if (id === 'PM') { ev.preventDefault(); return; }
      chip.classList.add('is-dragging');
    } else if (head) {
      kind = 'doc';
      id = head.getAttribute('data-pgb-doc-handle') || '';
      head.classList.add('is-dragging');
    } else return;
    _policyBoardDrag = { kind: kind, id: id };
    try {
      ev.dataTransfer.setData('text/plain', kind + ':' + id);
      ev.dataTransfer.effectAllowed = 'move';
    } catch (e) { /* ignore */ }
  });

  document.addEventListener('dragend', function() {
    _policyBoardDrag = null;
    policyBoardClearDragUi();
  });

  document.addEventListener('dragover', function(ev) {
    if (!_policyBoardDrag) return;
    var slotEl = ev.target.closest && ev.target.closest('[data-pgb-slot]');
    if (!slotEl) return;
    ev.preventDefault();
    try { ev.dataTransfer.dropEffect = 'move'; } catch (e) { /* ignore */ }
    policyBoardSetDropTarget(slotEl);
  });

  document.addEventListener('dragleave', function(ev) {
    var slotEl = ev.target.closest && ev.target.closest('[data-pgb-slot]');
    if (!slotEl) return;
    if (slotEl.contains(ev.relatedTarget)) return;
    slotEl.classList.remove('is-drop-target');
  });

  document.addEventListener('drop', function(ev) {
    var slotEl = ev.target.closest && ev.target.closest('[data-pgb-slot]');
    if (!slotEl) return;
    ev.preventDefault();
    var drag = _policyBoardDrag;
    _policyBoardDrag = null;
    policyBoardClearDragUi();
    var slot = slotEl.getAttribute('data-pgb-slot');
    setTimeout(function() { policyBoardApplyDrop(drag, slot); }, 0);
  });

  document.addEventListener('click', function(ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    if (t.closest('.pgb-menu')) return;
    var chipBtn = t.closest('[data-pgb-chip-menu]');
    if (chipBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      var fam = chipBtn.getAttribute('data-pgb-chip-menu');
      policyBoardOpenMenu(chipBtn, policyBoardMoveTargets(fam));
      return;
    }
    var mergeBtn = t.closest('[data-pgb-doc-merge]');
    if (mergeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      var master = mergeBtn.getAttribute('data-pgb-doc-merge');
      policyBoardOpenMenu(mergeBtn, policyBoardMergeTargets(master));
      return;
    }
    var splitBtn = t.closest('[data-pgb-split]');
    if (splitBtn) {
      ev.preventDefault();
      var parts = (splitBtn.getAttribute('data-pgb-split') || '').split(':');
      setTimeout(function() {
        if (policyBoardSplitFn(parts[0], parts[1])) policyBoardRerender();
      }, 0);
      return;
    }
    var resetBtn = t.closest('[data-pgb-reset]');
    if (resetBtn) {
      ev.preventDefault();
      setTimeout(function() {
        policyBoardResetCsf();
        policyBoardRerender();
      }, 0);
      return;
    }
    if (!t.closest('#policy-board-menu')) policyBoardCloseMenu();
  });

  document.addEventListener('keydown', function(ev) {
    if (ev.key === 'Escape') policyBoardCloseMenu();
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target && ev.target.closest) {
      var chip = ev.target.closest('[data-pgb-fam]');
      if (chip && ev.target === chip) {
        var btn = chip.querySelector('[data-pgb-chip-menu]');
        if (btn) {
          ev.preventDefault();
          policyBoardOpenMenu(btn, policyBoardMoveTargets(chip.getAttribute('data-pgb-fam')));
        }
      }
    }
  });

  document.addEventListener('change', function(ev) {
    var el = ev.target;
    if (!el || !el.getAttribute) return;
    var master = el.getAttribute('data-pgb-rename');
    if (!master) return;
    policyBoardRenameDoc(master, el.value);
  });
}

function renderPolicyBoardChipHtml(fam, canMove) {
  var menu = canMove
    ? '<button type="button" class="pgb-menu-btn" data-pgb-chip-menu="' + fam + '" aria-haspopup="menu" aria-label="Move ' + fam + '">Move</button>'
    : '';
  return '<span class="pgb-chip" draggable="true" data-pgb-fam="' + fam + '" tabindex="0">'
    + '<span class="pgb-chip-code">' + (typeof escapeHTML === 'function' ? escapeHTML(fam) : fam) + '</span>'
    + menu + '</span>';
}

function renderPolicyBoardCardHtml(d, opts) {
  opts = opts || {};
  var esc = typeof escapeHTML === 'function' ? escapeHTML : function(s) { return String(s || ''); };
  var extra = '';
  if (typeof opts.cardExtra === 'function') extra = opts.cardExtra(d) || '';
  var fnBits = (d.fnIds || []).map(function(fn) {
    return '<span class="pgb-fn csf-fn-' + String(fn).toLowerCase() + '">' + esc(fn) + ' ' + esc(policyBoardFnName(fn)) + '</span>';
  }).join('');
  var canMoveChip = !!(opts.canMoveChip);
  var chips = (d.families || []).map(function(f) { return renderPolicyBoardChipHtml(f, canMoveChip); }).join('');
  if (!chips && d.empty) {
    chips = '<span class="pgb-empty">Drop a family here</span>';
  }
  var mergeTargets = d.empty || d.master === '' ? [] : policyBoardMergeTargets(d.master);
  var mergeBtn = (!d.empty && mergeTargets.length)
    ? '<button type="button" class="pgb-menu-btn" data-pgb-doc-merge="' + esc(d.master) + '" aria-haspopup="menu" aria-label="Merge ' + esc(d.title) + '">Merge</button>'
    : '';
  var splitBtns = '';
  if (d.combined && d.fnIds.length > 1) {
    splitBtns = d.fnIds.map(function(fn) {
      return '<button type="button" class="btn btn-secondary btn-sm" data-pgb-split="' + esc(d.master) + ':' + fn + '">Split ' + esc(policyBoardFnName(fn)) + '</button>';
    }).join('');
  }
  var rename = (!d.empty && d.master)
    ? '<label class="pgb-rename-wrap"><span class="sr-only">Rename ' + esc(d.title) + '</span>'
      + '<input class="pgb-rename" data-pgb-rename="' + esc(d.master) + '" value="' + esc(d.title) + '" aria-label="Document title"></label>'
    : '';
  var handleAttrs = (!d.empty && d.master)
    ? ' draggable="true" data-pgb-doc-handle="' + esc(d.master) + '" title="Drag onto another document to merge"'
    : '';
  return '<div class="pgb-card' + (d.empty ? ' pgb-card-empty' : '') + (d.standalone ? ' pgb-card-standalone' : '')
    + (opts.mapped ? ' pgb-card-mapped' : '') + '" data-pgb-slot="' + esc(d.slot) + '" data-pgb-master="' + esc(d.master || '') + '">'
    + '<div class="pgb-card-head"' + handleAttrs + '>'
    + '<div class="pgb-card-head-main"><div class="pgb-card-title">' + esc(d.title) + '</div>'
    + '<div class="pgb-fn-row">' + fnBits + '</div></div>'
    + '<div class="pgb-card-head-actions">' + mergeBtn + splitBtns + (opts.statusHtml || '') + '</div>'
    + '</div>'
    + rename
    + extra
    + '<div class="pgb-chips">' + chips + '</div>'
    + '</div>';
}

function renderPolicyBoardPanelHtml(opts) {
  opts = opts || {};
  policyBoardEnsureDelegates();
  var model = getPolicyBoardDocuments();
  var functionDocs = model.docs.filter(function(d) { return !d.standalone; });
  var standalones = model.docs.filter(function(d) { return d.standalone; });
  var cardOpts = Object.assign({ canMoveChip: true }, opts);
  var cards = functionDocs.map(function(d) { return renderPolicyBoardCardHtml(d, cardOpts); }).join('');
  var empty = model.emptyFns.map(function(d) { return renderPolicyBoardCardHtml(d, cardOpts); }).join('');
  var alone = standalones.map(function(d) { return renderPolicyBoardCardHtml(d, cardOpts); }).join('');
  return '<div class="pgb-panel">'
    + '<div class="pgb-panel-head"><div>'
    + '<div class="pgb-panel-title">Policy documents</div>'
    + '<div class="pgb-panel-sub">Drag a family chip onto another document to move it. Drag a document header onto another to merge. Keyboard: Move on a chip, Merge on a document.</div>'
    + '</div><div class="pgb-actions">'
    + '<button type="button" class="btn btn-secondary btn-sm" data-pgb-reset>Reset to CSF defaults</button>'
    + '</div></div>'
    + '<div class="pgb-isp" role="note"><span class="pgb-fn">GV Govern</span>'
    + '<div><strong>Govern is the Information Security Policy.</strong> Program Management (PM) lives in the ISP \u2014 not as a domain card. Families cannot be dropped here.</div></div>'
    + '<div class="pgb-board">' + cards + empty + '</div>'
    + '<div class="pgb-well" data-pgb-slot="standalone">'
    + '<div class="pgb-well-label">Standalone documents</div>'
    + '<p class="pgb-well-hint">Drop a family here to give it its own document.</p>'
    + (alone || '<span class="pgb-empty">None \u2014 every family sits in a Function document.</span>')
    + '</div></div>';
}
