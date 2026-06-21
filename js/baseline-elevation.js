// js/baseline-elevation.js — CISO approval workflow for elevated-baseline asset subtypes (V3).
// Load after js/assets.js. Never mutates state.baseline.

function beCiaOrder(ch) {
  return { L: 1, M: 2, H: 3 }[ch] || 0;
}

function beTargetLabelLetter(t) {
  return t === 'M' ? 'Moderate' : t === 'H' ? 'High' : 'Low';
}

function beTargetLetterFromAssetImpact(letter) {
  return letter === 'H' ? 'H' : 'M';
}

/** Map asset row to stable base key for dedupe (built-in key, custom:Name, or label:). */
function resolveBaseAssetTypeKey(asset) {
  if (!asset) return '';
  if (asset._elevationBaseTypeKey) return asset._elevationBaseTypeKey;
  var t = String(asset.type || '').trim();
  var recs = state.baselineElevationRecommendations || [];
  for (var i = 0; i < recs.length; i++) {
    if (recs[i].elevatedSubtypeName === t && recs[i].baseAssetTypeKey) {
      return recs[i].baseAssetTypeKey;
    }
  }
  var k = typeof getAssetTypeKey === 'function' ? getAssetTypeKey(t) : null;
  if (k) return k;
  if (t && (state.customAssetTypes || []).indexOf(t) !== -1) return 'custom:' + t;
  return 'label:' + t;
}

function getDisplayNameForBaseKey(baseKey, assetTypeLabel) {
  if (baseKey.indexOf('custom:') === 0) return baseKey.slice(7);
  if (baseKey.indexOf('label:') === 0) return baseKey.slice(6);
  for (var i = 0; i < ASSET_TYPES.length; i++) {
    for (var j = 0; j < ASSET_TYPES[i].types.length; j++) {
      if (ASSET_TYPES[i].types[j].key === baseKey) return ASSET_TYPES[i].types[j].label;
    }
  }
  return assetTypeLabel || baseKey;
}

function getHeaderGroupForBaseKey(baseKey, asset) {
  if (baseKey.indexOf('custom:') === 0) {
    var n = baseKey.slice(7);
    return (state.customAssetTypeGroups || {})[n] || 'Custom';
  }
  for (var i = 0; i < ASSET_TYPES.length; i++) {
    for (var j = 0; j < ASSET_TYPES[i].types.length; j++) {
      if (ASSET_TYPES[i].types[j].key === baseKey) return ASSET_TYPES[i].category;
    }
  }
  if (asset && asset.type) {
    var g = (state.customAssetTypeGroups || {})[asset.type];
    if (g) return g;
  }
  return 'Custom';
}

/** Delta: program-family scope, control in target BL, not in program baseline. */
function computeBaselineElevationDelta(targetBaseline, programBaseline) {
  var fams = typeof getActiveFamilies === 'function' ? getActiveFamilies() : [];
  var famSet = {};
  fams.forEach(function(f) { famSet[f] = true; });
  return CONTROLS.filter(function(c) {
    if (!famSet[c.f]) return false;
    if (!c.bl || !c.bl.length) return false;
    if (c.bl.indexOf(targetBaseline) === -1) return false;
    if (c.bl.indexOf(programBaseline) !== -1) return false;
    return true;
  }).map(function(c) { return c.id; });
}

function buildElevatedSubtypeName(baseDisplayName, targetBaseline) {
  return baseDisplayName + ' — Elevated (' + beTargetLabelLetter(targetBaseline) + ')';
}

function userMayActOnBaselineElevation() {
  if (!state.currentUserId) return true;
  var u = (state.users || []).find(function(x) { return x.id === state.currentUserId; });
  if (!u) return false;
  if (u.role === 'ciso' || u.role === 'issm') return true;
  if ((u.roles || []).indexOf('ciso') !== -1) return true;
  return false;
}

function findRecommendationsForBase(baseKey) {
  return (state.baselineElevationRecommendations || []).filter(function(r) {
    return r.baseAssetTypeKey === baseKey;
  });
}

function getMaxTargetOrderForBase(baseKey) {
  var recs = findRecommendationsForBase(baseKey);
  var m = 0;
  recs.forEach(function(r) { m = Math.max(m, beCiaOrder(r.targetBaseline)); });
  return m;
}

function findApprovedRecForTarget(baseKey, targetLetter) {
  var recs = findRecommendationsForBase(baseKey);
  for (var i = 0; i < recs.length; i++) {
    if (recs[i].status === 'Approved' && recs[i].targetBaseline === targetLetter) return recs[i];
  }
  return null;
}

/**
 * If an approved elevated subtype exists for this impact, migrate asset.type and set _elevationBaseTypeKey.
 */
function maybeAutoMigrateAssetToApprovedSubtype(asset, assetImpactLetter) {
  if (!asset) return;
  if (beCiaOrder(assetImpactLetter) <= beCiaOrder(getProgramBaselineFipsLetter())) return;
  var targetL = beTargetLetterFromAssetImpact(assetImpactLetter);
  var baseKey = resolveBaseAssetTypeKey(asset);
  var approved = findApprovedRecForTarget(baseKey, targetL);
  if (!approved) return;
  if (asset.type === approved.elevatedSubtypeName) {
    if (!asset._elevationBaseTypeKey) asset._elevationBaseTypeKey = baseKey;
    return;
  }
  asset.type = approved.elevatedSubtypeName;
  asset._elevationBaseTypeKey = baseKey;
  markDirty();
}

/**
 * System Profile (step 2): FIPS above program → V3 messaging (V2 banner stays in assets.js).
 */
function processBaselineElevationOnSystemProfile(asset, assetImpactLetter) {
  if (!asset) return '';
  var programBl = getProgramBaselineFipsLetter();
  if (beCiaOrder(assetImpactLetter) <= beCiaOrder(programBl)) {
    return '';
  }

  var baseKey = resolveBaseAssetTypeKey(asset);
  var baseName = getDisplayNameForBaseKey(baseKey, asset.type);
  maybeAutoMigrateAssetToApprovedSubtype(asset, assetImpactLetter);

  var recs = findRecommendationsForBase(baseKey);
  var maxTargetOrder = getMaxTargetOrderForBase(baseKey);
  var io = beCiaOrder(assetImpactLetter);
  var letter = beTargetLetterFromAssetImpact(assetImpactLetter);

  function atLevel(lev) {
    return recs.filter(function(r) { return r.targetBaseline === lev; });
  }

  var aLev = atLevel(letter);
  var app = aLev.find(function(r) { return r.status === 'Approved'; });
  if (app) {
    maybeAutoMigrateAssetToApprovedSubtype(asset, assetImpactLetter);
    return '<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#065f46;line-height:1.5;">'
      + '<div style="font-weight:800;margin-bottom:4px;">Baseline elevation (approved)</div>'
      + 'The CISO has approved an elevated subtype for this asset type. This asset has been associated with <strong>' + escapeHTML(app.elevatedSubtypeName) + '</strong>.</div>';
  }
  var rej = aLev.find(function(r) { return r.status === 'Rejected'; });
  if (rej) {
    return '<div style="background:#fff1f2;border:1px solid #fda4af;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#9f1239;line-height:1.5;">'
      + '<div style="font-weight:800;margin-bottom:4px;">Baseline elevation declined</div>'
      + 'The CISO previously declined elevation of this asset type to <strong>' + beTargetLabelLetter(rej.targetBaseline) + '</strong> on ' + escapeHTML(rej.decisionDate || '—') + '. '
      + (rej.decisionRationale ? '<em>Rationale:</em> ' + escapeHTML(rej.decisionRationale) + ' ' : '')
      + 'This asset remains on the program baseline.</div>';
  }
  var pendL = aLev.find(function(r) { return r.status === 'Pending'; });
  if (pendL) {
    return '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#92400e;line-height:1.5;">'
      + '<div style="font-weight:800;margin-bottom:4px;">CISO review in progress</div>'
      + 'A proposal to add <strong>' + escapeHTML(pendL.elevatedSubtypeName) + '</strong> to the asset catalog is <strong>Pending</strong> CISO review. '
      + 'See <strong>Reports</strong> → Baseline Elevation. Recommendation id: <code style="font-size:11px;">' + escapeHTML(pendL.id) + '</code></div>';
  }

  if (io <= maxTargetOrder) {
    var pendHigher = recs.filter(function(r) {
      return r.status === 'Pending' && beCiaOrder(r.targetBaseline) > io;
    }).sort(function(a, b) { return beCiaOrder(a.targetBaseline) - beCiaOrder(b.targetBaseline); });
    if (pendHigher.length) {
      var ph = pendHigher[0];
      return '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#92400e;line-height:1.5;">'
        + '<div style="font-weight:800;margin-bottom:4px;">Baseline elevation in progress (higher tier)</div>'
        + 'A CISO review is already pending to add <strong>' + escapeHTML(ph.elevatedSubtypeName) + '</strong> to the asset catalog. '
        + 'That decision may cover systems like this one once decided.</div>';
    }
  }

  if (io > maxTargetOrder) {
    var hasPendingSame = recs.some(function(r) { return r.status === 'Pending' && r.targetBaseline === letter; });
    var hasPendingThisAsset = recs.some(function(r) {
      return r.status === 'Pending' && r.targetBaseline === letter && r.triggerAssetId === asset.id;
    });
    if (!hasPendingThisAsset && !hasPendingSame) {
      createBaselineElevationRecommendation(asset, letter, baseKey, baseName);
    }
  }

  var newRec = findRecommendationsForBase(baseKey).find(function(r) {
    return r.status === 'Pending' && r.targetBaseline === letter;
  });
  if (newRec) {
    return '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#92400e;line-height:1.5;">'
      + '<div style="font-weight:800;margin-bottom:4px;">CISO notification</div>'
      + 'A recommendation has been sent to the CISO to create a <strong>' + escapeHTML(newRec.elevatedSubtypeName) + '</strong> asset type for high-risk systems like this. <strong>Status: Pending review.</strong> '
      + 'The program baseline is unchanged; only a CISO decision can add a tailored system-class subtype to the asset catalog (NIST tailoring with additions at the system-class level).</div>';
  }

  return '';
}

function createBaselineElevationRecommendation(asset, targetLetter, baseKey, baseName) {
  if (!state.baselineElevationRecommendations) state.baselineElevationRecommendations = [];
  var programBl = getProgramBaselineFipsLetter();
  if (beCiaOrder(targetLetter) <= beCiaOrder(programBl)) return;

  var maxO = getMaxTargetOrderForBase(baseKey);
  if (beCiaOrder(targetLetter) <= maxO) return;

  if (findRecommendationsForBase(baseKey).some(function(r) { return r.status === 'Pending' && r.targetBaseline === targetLetter; })) {
    return;
  }

  var headerGroup = getHeaderGroupForBaseKey(baseKey, asset);
  var subName = buildElevatedSubtypeName(baseName, targetLetter);
  var deltaIds = computeBaselineElevationDelta(targetLetter, programBl);

  var rec = {
    id: 'be-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    baseAssetTypeKey: baseKey,
    baseAssetTypeName: baseName,
    headerGroup: headerGroup,
    elevatedSubtypeName: subName,
    targetBaseline: targetLetter,
    programBaselineAtTimeOfRec: programBl,
    deltaControlIds: deltaIds,
    triggerAssetId: asset.id,
    triggerAssetName: asset.name || asset.id,
    submittedDate: new Date().toISOString().slice(0, 10),
    status: 'Pending',
    decisionDate: '',
    decisionBy: '',
    decisionRationale: '',
    policyOwnerNotifications: []
  };
  state.baselineElevationRecommendations.push(rec);
  if (!state.controlReviewQueue) state.controlReviewQueue = [];
  var alreadyQueued = state.controlReviewQueue.some(function(q) {
    return q.type === 'baseline-elevation' && q.recommendationId === rec.id;
  });
  if (!alreadyQueued) {
    state.controlReviewQueue.push({
      type: 'baseline-elevation',
      recommendationId: rec.id,
      date: rec.submittedDate,
      status: 'Pending',
      baseName: baseName
    });
  }
  addAuditEntry('asset', asset.id, 'Baseline elevation recommendation to CISO: ' + subName + ' (delta ' + deltaIds.length + ' controls).');
  markDirty();
}

function baselineElevationRationaleFieldId(recId) {
  return 'be-rat-' + String(recId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function approveBaselineElevationFromUi(recId) {
  if (!userMayActOnBaselineElevation()) {
    showToast('Only a CISO (or program admin) can approve baseline elevation recommendations.', true);
    return;
  }
  var el = document.getElementById(baselineElevationRationaleFieldId(recId));
  var rationale = (el && el.value) ? String(el.value).trim() : '';
  if (!rationale) { showToast('Rationale is required to approve.', true); return; }
  approveBaselineElevation(recId, rationale);
}

function rejectBaselineElevationFromUi(recId) {
  if (!userMayActOnBaselineElevation()) {
    showToast('Only a CISO (or program admin) can reject baseline elevation recommendations.', true);
    return;
  }
  var el = document.getElementById(baselineElevationRationaleFieldId(recId));
  var rationale = (el && el.value) ? String(el.value).trim() : '';
  if (!rationale) { showToast('Rationale is required to reject.', true); return; }
  rejectBaselineElevation(recId, rationale);
}

function approveBaselineElevation(recId, decisionRationale) {
  var rec = (state.baselineElevationRecommendations || []).find(function(r) { return r.id === recId; });
  if (!rec || rec.status !== 'Pending') { showToast('Recommendation not found or already decided.', true); return; }

  var act = state.currentUserId && (state.users || []).find(function(u) { return u.id === state.currentUserId; });
  var decBy = (act && act.name) || state.programOwner || 'CISO';

  if (!state.customAssetTypes) state.customAssetTypes = [];
  if (state.customAssetTypes.indexOf(rec.elevatedSubtypeName) === -1) {
    state.customAssetTypes.push(rec.elevatedSubtypeName);
  }
  if (!state.customAssetTypeGroups) state.customAssetTypeGroups = {};
  state.customAssetTypeGroups[rec.elevatedSubtypeName] = rec.headerGroup;
  try { ensureAssetTypeMetadata(); } catch (e) { /* */ }

  if (!state.controlStatus) state.controlStatus = {};
  if (!state.controlOwners) state.controlOwners = {};
  var covKey = 'custom_' + rec.elevatedSubtypeName;
  var skipped = 0;

  rec.deltaControlIds.forEach(function(cid) {
    if (!state.controlStatus[cid]) state.controlStatus[cid] = {};
    if (!state.controlStatus[cid].assetCoverage) state.controlStatus[cid].assetCoverage = {};
    state.controlStatus[cid].assetCoverage[covKey] = true;

    if (state.controlOwners[cid]) {
      skipped++;
      return;
    }
    state.controlOwners[cid] = {
      assignee: null,
      name: '',
      role: '',
      email: '',
      status: 'unassigned',
      subtypeScope: rec.elevatedSubtypeName
    };
  });

  var notifs = [];
  var famSeen = {};
  rec.deltaControlIds.forEach(function(cid) {
    var c = CONTROLS.find(function(x) { return x.id === cid; });
    if (!c) return;
    if (famSeen[c.f]) return;
    famSeen[c.f] = true;
    var o = (state.domainOwners || {})[c.f] || {};
    var dCtrls = rec.deltaControlIds.filter(function(id) { return (CONTROLS.find(function(z) { return z.id === id; }) || {}).f === c.f; });
    notifs.push({
      family: c.f,
      ownerName: o.name || '',
      ownerEmail: o.email || '',
      message: 'New elevated-baseline controls in scope for ' + rec.elevatedSubtypeName + '. Update the ' + c.f + " policy with an 'Additional Measures for Elevated-Baseline Assets' section covering: " + dCtrls.join(', ') + '.',
      acknowledged: false
    });
  });
  rec.policyOwnerNotifications = notifs;

  var programBl = getProgramBaselineFipsLetter();
  (state.assets || []).forEach(function(a) {
    if (resolveBaseAssetTypeKey(a) !== rec.baseAssetTypeKey) return;
    var cat = (state.assetCategorization || {})[a.id];
    if (!cat) return;
    var im = typeof computeAssetOverallFipsImpact === 'function' ? computeAssetOverallFipsImpact(cat) : 'L';
    if (beCiaOrder(im) > beCiaOrder(programBl) && beCiaOrder(im) <= beCiaOrder(rec.targetBaseline)) {
      a.type = rec.elevatedSubtypeName;
      a._elevationBaseTypeKey = rec.baseAssetTypeKey;
    }
  });

  rec.status = 'Approved';
  rec.decisionDate = new Date().toISOString().slice(0, 10);
  rec.decisionBy = decBy;
  rec.decisionRationale = decisionRationale;
  state.controlReviewQueue = (state.controlReviewQueue || []).filter(function(q) {
    return !(q.type === 'baseline-elevation' && q.recommendationId === recId);
  });
  addAuditEntry('baseline', recId, 'Approved elevation of ' + rec.baseAssetTypeName + ' to ' + rec.targetBaseline + '; subtype ' + rec.elevatedSubtypeName + ' created; ' + rec.deltaControlIds.length + ' delta controls added' + (skipped ? ' (' + skipped + ' already in program, not re-added)' : ''));
  markDirty();
  showToast('Approved: elevated asset subtype was added to the catalog.');
  if (typeof renderReports === 'function') setTimeout(function() { renderReports(); }, 0);
  if (typeof renderAssetTypeLibrary === 'function') setTimeout(function() { renderAssetTypeLibrary(); }, 0);
  try { if (state._selectedAssetId) renderAssetTab(); } catch (e) { /* */ }
}

function rejectBaselineElevation(recId, decisionRationale) {
  var rec = (state.baselineElevationRecommendations || []).find(function(r) { return r.id === recId; });
  if (!rec || rec.status !== 'Pending') { showToast('Recommendation not found or already decided.', true); return; }
  var act = state.currentUserId && (state.users || []).find(function(u) { return u.id === state.currentUserId; });
  var decBy = (act && act.name) || state.programOwner || 'CISO';
  rec.status = 'Rejected';
  rec.decisionDate = new Date().toISOString().slice(0, 10);
  rec.decisionBy = decBy;
  rec.decisionRationale = decisionRationale;
  state.controlReviewQueue = (state.controlReviewQueue || []).filter(function(q) {
    return !(q.type === 'baseline-elevation' && q.recommendationId === recId);
  });
  addAuditEntry('baseline', recId, 'Rejected elevation of ' + rec.baseAssetTypeName + ' to ' + rec.targetBaseline + '; rationale: ' + (decisionRationale || ''));
  markDirty();
  showToast('Baseline elevation was declined and recorded.');
  if (typeof renderReports === 'function') setTimeout(function() { renderReports(); }, 0);
  try { if (state._selectedAssetId) renderAssetTab(); } catch (e) { /* */ }
}

function acknowledgePolicyElevationNotification(recId, fam) {
  var rec = (state.baselineElevationRecommendations || []).find(function(r) { return r.id === recId; });
  if (!rec) return;
  (rec.policyOwnerNotifications || []).forEach(function(n) {
    if (n.family === fam) n.acknowledged = true;
  });
  markDirty();
  showToast('Acknowledged — you can proceed with control owner assignments in this domain when ready.');
  if (typeof renderPolicyTab === 'function') setTimeout(function() { renderPolicyTab(); }, 0);
}

function getOpenPolicyNotificationsForCurrentUser() {
  var out = [];
  var u = state.currentUserId && (state.users || []).find(function(x) { return x.id === state.currentUserId; });
  (state.baselineElevationRecommendations || []).forEach(function(rec) {
    if (rec.status !== 'Approved') return;
    (rec.policyOwnerNotifications || []).forEach(function(n) {
      if (n.acknowledged) return;
      if (!u) { out.push({ rec: rec, n: n }); return; }
      var byFam = (u.families || []).indexOf(n.family) !== -1;
      var byName = u.name && n.ownerName && (u.name.toLowerCase() === n.ownerName.toLowerCase());
      if (byFam || byName) out.push({ rec: rec, n: n });
    });
  });
  return out;
}

function renderPolicyElevationBlockingHtml() {
  var items = getOpenPolicyNotificationsForCurrentUser();
  if (!items.length) return '';
  return '<div style="background:#fff1f2;border:2px solid #f43f5e;border-radius:12px;padding:14px 16px;margin-bottom:18px;">'
    + '<div style="font-size:14px;font-weight:800;color:#9f1239;">Policy update required (elevated-baseline scope)</div>'
    + '<div style="font-size:12px;color:var(--text);margin:8px 0;line-height:1.5;">Acknowledge after you add the required section to the domain policy. Control owner assignment for new delta controls in this family stays blocked in the UI until this is acknowledged (per your program workflow).</div>'
    + items.map(function(o) {
      return '<div style="background:white;border:1px solid #fecdd3;border-radius:8px;padding:10px 12px;margin-top:8px;">'
        + '<div><span class="family-badge" style="margin-right:6px;">' + escapeHTML(o.n.family) + '</span> '
        + '<span style="font-size:12px;font-weight:700;">' + escapeHTML((o.rec && o.rec.elevatedSubtypeName) || '') + '</span></div>'
        + '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">' + escapeHTML(o.n.message) + '</div>'
        + '<button type="button" class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="setTimeout(function() { acknowledgePolicyElevationNotification(' + JSON.stringify(o.rec.id) + ',' + JSON.stringify(o.n.family) + '); },0)">Acknowledge — policy updated</button>'
        + '</div>';
    }).join('')
    + '</div>';
}

function renderBaselineElevationReportsSummaryHtml() {
  var all = state.baselineElevationRecommendations || [];
  var p = all.filter(function(r) { return r.status === 'Pending'; }).length;
  var a = all.filter(function(r) { return r.status === 'Approved' });
  var rj = all.filter(function(r) { return r.status === 'Rejected' });
  return '<div id="be-reports-panel" style="background:white;border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:20px;max-width:1020px;">'
    + '<div style="font-size:14px;font-weight:800;color:var(--navy);margin-bottom:6px;">Baseline Elevation Recommendations</div>'
    + '<div style="font-size:12px;color:var(--text-muted);line-height:1.5;">'
    + 'Pending: <a href="#be-ciso-elevation" style="color:var(--teal);font-weight:700;" onclick="event.preventDefault();document.getElementById(\'be-ciso-elevation\')&&document.getElementById(\'be-ciso-elevation\').scrollIntoView({behavior:\'smooth\'});">'
    + p + ' in CISO review</a> · '
    + 'Approved subtypes: ' + a.length + ' · Rejected: ' + rj.length
    + '</div>'
    + (a.length ? '<div style="margin-top:8px;font-size:12px;font-weight:700;">Approved catalog subtypes</div><ul style="margin:4px 0 0 18px;font-size:12px;">' + a.map(function(x) { return '<li>' + escapeHTML(x.elevatedSubtypeName) + ' (' + x.targetBaseline + ')</li>'; }).join('') + '</ul>' : '')
    + (rj.length ? '<div style="margin-top:8px;font-size:12px;font-weight:700;">Declined (with rationale in audit)</div><ul style="margin:4px 0 0 18px;font-size:11px;color:var(--text-muted);">' + rj.map(function(x) {
        return '<li>' + escapeHTML(x.baseAssetTypeName) + ' → ' + x.targetBaseline + ' on ' + escapeHTML(x.decisionDate || '—') + '</li>';
      }).join('') + '</ul>' : '')
    + '<div style="font-size:11px;color:var(--text-muted);margin-top:8px;">Amber System Profile messages reference this workflow; the program <code>baseline</code> in CISO setup is never auto-changed by these decisions.</div>'
    + '</div>';
}

function renderBaselineElevationCisoCardsHtml() {
  if (state.currentUserId && !userMayActOnBaselineElevation()) {
    return '<div id="be-ciso-elevation" style="height:1px;overflow:hidden;margin:0" aria-hidden="true"></div>';
  }
  var pending = (state.baselineElevationRecommendations || []).filter(function(r) { return r.status === 'Pending'; });
  if (!pending.length) {
    return '<div id="be-ciso-elevation" style="height:1px;overflow:hidden;margin:0" aria-hidden="true"></div>';
  }

  var canAct = userMayActOnBaselineElevation() || !state.currentUserId;
  return '<div id="be-ciso-elevation" style="background:linear-gradient(135deg,#fff7ed,#fffbeb);border:1px solid #fbbf24;border-radius:12px;padding:18px;margin-bottom:20px;max-width:1020px;">'
    + '<div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:8px;">CISO: Baseline Elevation Recommendations</div>'
    + '<p style="font-size:12px;color:var(--text-muted);margin:0 0 12px;">NIST-consistent tailoring with additions: CISO/ AO decision at system-class; tool does not change program baseline. Delta lists include <strong>all</strong> applicable control enhancements by family; control owners later mark inapplicable during implementation. Full rationale required for approve or reject.</p>'
    + pending.map(function(rec) {
      var fams = {};
      rec.deltaControlIds.forEach(function(cid) {
        var c = CONTROLS.find(function(x) { return x.id === cid; });
        if (!c) return;
        if (!fams[c.f]) fams[c.f] = [];
        if (fams[c.f].length < 40) fams[c.f].push(cid);
      });
      var fieldId = baselineElevationRationaleFieldId(rec.id);
      var aName = rec.triggerAssetName || rec.triggerAssetId || '';
      return '<div style="background:white;border:1px solid #fcd34d;border-radius:10px;padding:14px 16px;margin-bottom:12px;">'
        + '<div style="font-size:10px;font-weight:800;letter-spacing:0.4px;text-transform:uppercase;color:#b45308;">Baseline Elevation — review</div>'
        + '<div style="font-size:16px;font-weight:800;color:var(--navy);margin:6px 0;">Elevate ' + escapeHTML(rec.baseAssetTypeName) + ' to ' + beTargetLabelLetter(rec.targetBaseline) + ' baseline</div>'
        + '<div style="font-size:12px;color:var(--text);">'
        + 'Triggering asset: <a href="#" onclick="event.preventDefault();showTab(\'asset\');if(typeof enterAssetSSP===\'function\'){enterAssetSSP(' + JSON.stringify(String(rec.triggerAssetId)) + ');}" style="color:var(--teal);font-weight:600;">' + escapeHTML(aName) + '</a>'
        + ' · Program baseline: ' + escapeHTML(String(rec.programBaselineAtTimeOfRec)) + ' · Proposed: <strong>' + escapeHTML(rec.elevatedSubtypeName) + '</strong>'
        + '</div>'
        + '<details style="margin:10px 0;font-size:12px;"><summary style="cursor:pointer;font-weight:600;">Delta controls (' + rec.deltaControlIds.length + ')</summary>'
        + Object.keys(fams).sort().map(function(f) {
          return '<div style="margin-top:6px;"><span class="family-badge">' + escapeHTML(f) + '</span> <span style="font-size:11px;font-family:monospace;">' + fams[f].map(function(x) { return escapeHTML(x); }).join(', ') + '</span></div>';
        }).join('') + '</details>'
        + (canAct
          ? '<div class="form-group" style="margin-top:8px;">'
            + '<label class="form-label">Rationale <span style="color:var(--red)">*</span> (required)</label>'
            + '<textarea class="form-input" id="' + fieldId + '" rows="2" style="font-size:12px;" placeholder="Auditable decision for approval or rejection"></textarea></div>'
            + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
            + '<button type="button" class="btn btn-primary btn-sm" onclick="setTimeout(function() { approveBaselineElevationFromUi(' + JSON.stringify(String(rec.id)) + '); },0)">Approve</button>'
            + '<button type="button" class="btn btn-secondary btn-sm" style="border-color:#b91c1c;color:#991b1b;" onclick="setTimeout(function() { rejectBaselineElevationFromUi(' + JSON.stringify(String(rec.id)) + '); },0)">Reject</button>'
            + '</div>'
          : '<div style="font-size:12px;color:var(--text-muted);">Only a CISO or program admin can approve or reject.</div>')
        + '</div>';
    }).join('')
    + '</div>';
}

function isElevatedCustomAssetTypeName(label) {
  return / — Elevated \((?:Low|Moderate|High)\)$/.test(String(label || ''));
}
