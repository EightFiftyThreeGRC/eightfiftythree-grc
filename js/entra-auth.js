// js/entra-auth.js — Microsoft Entra ID (Azure AD) sign-in via MSAL.js (browser SPA, no backend)

var __msalInstance = null;
var __msalLoadPromise = null;
var ENTRA_LOGIN_SCOPES = ['openid', 'profile', 'email', 'User.Read'];

function getEntraConfig() {
  var cfg = state.entraConfig || {};
  var tenant = String(cfg.tenantId || 'organizations').trim() || 'organizations';
  return {
    enabled: !!cfg.enabled,
    clientId: String(cfg.clientId || '').trim(),
    tenantId: tenant,
    authority: 'https://login.microsoftonline.com/' + encodeURIComponent(tenant)
  };
}

function isEntraAuthEnabled() {
  var cfg = getEntraConfig();
  return cfg.enabled && !!cfg.clientId;
}

function getEntraRedirectUri() {
  var cfg = state.entraConfig || {};
  if (cfg.redirectUri && String(cfg.redirectUri).trim()) return String(cfg.redirectUri).trim();
  try {
    var href = window.location.href.split('#')[0].split('?')[0];
    return href.replace(/\/[^/]*\.html?$/i, function(m) {
      return m.toLowerCase() === '/index.html' || m.toLowerCase() === '/app.html' ? '/' : m;
    }).replace(/\/$/, '') || window.location.origin + '/';
  } catch (e) {
    return window.location.origin + '/';
  }
}

function loadMsalScript() {
  if (typeof msal !== 'undefined' && msal.PublicClientApplication) return Promise.resolve();
  if (__msalLoadPromise) return __msalLoadPromise;
  __msalLoadPromise = new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = 'https://alcdn.msauth.net/browser/2.39.0/js/msal-browser.min.js';
    s.async = true;
    s.onload = function() { resolve(); };
    s.onerror = function() { reject(new Error('Failed to load Microsoft authentication library.')); };
    document.head.appendChild(s);
  });
  return __msalLoadPromise;
}

async function ensureMsalInstance() {
  if (__msalInstance) return __msalInstance;
  if (!isEntraAuthEnabled()) return null;
  await loadMsalScript();
  var cfg = getEntraConfig();
  __msalInstance = new msal.PublicClientApplication({
    auth: {
      clientId: cfg.clientId,
      authority: cfg.authority,
      redirectUri: getEntraRedirectUri(),
      navigateToLoginRequestUrl: false
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false
    }
  });
  await __msalInstance.initialize();
  return __msalInstance;
}

function setEntraConfigField(field, value) {
  if (!state.entraConfig) {
    state.entraConfig = { enabled: false, clientId: '', tenantId: 'organizations', redirectUri: '' };
  }
  var prev = state.entraConfig[field];
  if (field === 'enabled') state.entraConfig.enabled = !!value;
  else state.entraConfig[field] = value;
  if (field === 'clientId' || field === 'tenantId' || field === 'enabled') {
    __msalInstance = null;
  }
  logFieldChange('entraConfig.' + field, prev, value);
  markDirty();
}

function findProgramUserForEntraIdentity(email, displayName) {
  if (typeof syncUsersFromState === 'function') syncUsersFromState();
  var em = String(email || '').trim().toLowerCase();
  var nm = String(displayName || '').trim().toLowerCase();
  var matches = (state.users || []).filter(function(u) {
    if (u.isDemoPlaceholder) return false;
    if (em && String(u.email || '').trim().toLowerCase() === em) return true;
    if (nm && String(u.name || '').trim().toLowerCase() === nm) return true;
    return false;
  });
  if (!matches.length) return null;
  var rolePriority = ['ciso', 'ao', 'assessor', 'issm', 'control-owner', 'asset-owner', 'custodian', 'approver'];
  matches.sort(function(a, b) {
    var ia = rolePriority.indexOf(a.role);
    var ib = rolePriority.indexOf(b.role);
    if (ia === -1) ia = 99;
    if (ib === -1) ib = 99;
    return ia - ib;
  });
  return matches[0];
}

function applyEntraSignIn(account, silent) {
  if (!account) return false;
  var email = String(account.username || (account.idTokenClaims && (account.idTokenClaims.preferred_username || account.idTokenClaims.email)) || '').trim();
  var name = String(account.name || (account.idTokenClaims && account.idTokenClaims.name) || email.split('@')[0] || 'User').trim();
  var matched = findProgramUserForEntraIdentity(email, name);
  if (!matched) {
    if (!silent) {
      showToast('Your Microsoft account (' + (email || name) + ') is not on this program roster. Ask your CISO to add you under Users & roles with this email.', true);
    }
    return false;
  }
  state.entraSession = {
    email: email,
    name: name,
    oid: account.localAccountId || account.homeAccountId || '',
    matchedUserId: matched.id,
    signedInAt: new Date().toISOString()
  };
  markDirty();
  if (typeof applyRoleView === 'function') applyRoleView(matched.id);
  var overlay = document.getElementById('rolePickerOverlay');
  if (overlay) overlay.style.display = 'none';
  if (typeof maybePromptProfileSetup === 'function') maybePromptProfileSetup(matched);
  if (!silent) showToast('Signed in with Microsoft as ' + (typeof getOwnerDisplayName === 'function' ? getOwnerDisplayName(matched) : (matched.name || matched.email || 'user')));
  return true;
}

async function signInWithMicrosoft() {
  if (!isEntraAuthEnabled()) {
    showToast('Microsoft sign-in is not configured. Add an Entra app registration under Users & roles.', true);
    return;
  }
  try {
    var msalInst = await ensureMsalInstance();
    if (!msalInst) return;
    var result = await msalInst.loginPopup({ scopes: ENTRA_LOGIN_SCOPES, prompt: 'select_account' });
    if (result && result.account) applyEntraSignIn(result.account, false);
  } catch (err) {
    if (err && (err.errorCode === 'user_cancelled' || err.errorCode === 'popup_window_error')) return;
    console.warn('Entra sign-in:', err);
    showToast('Microsoft sign-in failed: ' + (err.message || err.errorCode || 'unknown error'), true);
  }
}

async function signInWithMicrosoftRedirect() {
  if (!isEntraAuthEnabled()) {
    showToast('Microsoft sign-in is not configured.', true);
    return;
  }
  try {
    var msalInst = await ensureMsalInstance();
    if (!msalInst) return;
    await msalInst.loginRedirect({ scopes: ENTRA_LOGIN_SCOPES, prompt: 'select_account' });
  } catch (err) {
    showToast('Could not start Microsoft sign-in.', true);
  }
}

async function signOutMicrosoft() {
  try {
    var msalInst = await ensureMsalInstance();
    if (msalInst) {
      var accounts = msalInst.getAllAccounts();
      if (accounts.length) {
        await msalInst.logoutPopup({ account: accounts[0] });
      }
    }
  } catch (e) { /* popup blocked or already signed out */ }
  state.entraSession = null;
  markDirty();
  if (typeof applyRoleView === 'function') applyRoleView('admin');
  showToast('Signed out of Microsoft.');
}

function clearEntraSessionLocal() {
  state.entraSession = null;
  markDirty();
}

async function initEntraAuth() {
  if (!isEntraAuthEnabled()) return false;
  try {
    var msalInst = await ensureMsalInstance();
    if (!msalInst) return false;
    var redirectResult = await msalInst.handleRedirectPromise();
    if (redirectResult && redirectResult.account) {
      return applyEntraSignIn(redirectResult.account, false);
    }
    var accounts = msalInst.getAllAccounts();
    if (accounts.length && state.entraSession) {
      try {
        await msalInst.acquireTokenSilent({ scopes: ENTRA_LOGIN_SCOPES, account: accounts[0] });
      } catch (silentErr) {
        return false;
      }
      return applyEntraSignIn(accounts[0], true);
    }
  } catch (e) {
    console.warn('initEntraAuth:', e);
  }
  return false;
}

function renderEntraAuthPickerSection() {
  var el = document.getElementById('entraAuthPickerSection');
  if (!el) return;
  if (!isEntraAuthEnabled()) {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }
  el.style.display = '';
  var signedIn = !!(state.entraSession && state.entraSession.email);
  el.innerHTML = '<div class="entra-picker-panel">'
    + '<div class="entra-picker-head">'
    + '<svg class="entra-ms-logo" width="20" height="20" viewBox="0 0 21 21" aria-hidden="true"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>'
    + '<div><div class="entra-picker-title">Sign in with Microsoft</div>'
    + '<div class="entra-picker-sub">Use your work account (Entra ID). We match you to this program\'s roster by email.</div></div>'
    + '</div>'
    + (signedIn
      ? '<div class="entra-signed-in-bar">'
        + '<span>Signed in as <strong>' + escapeHTML(state.entraSession.email) + '</strong></span>'
        + '<button type="button" class="btn btn-secondary btn-sm" onclick="signOutMicrosoft()">Sign out</button>'
        + '</div>'
      : '<div class="entra-picker-actions">'
        + '<button type="button" class="btn entra-signin-btn" onclick="signInWithMicrosoft()">'
        + '<svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>'
        + ' Sign in with Microsoft</button>'
        + '<button type="button" class="btn btn-secondary btn-sm" onclick="signInWithMicrosoftRedirect()">Use redirect instead</button>'
        + '</div>')
    + '<div class="entra-picker-divider"><span>or pick a profile below</span></div>'
    + '</div>';
}

function renderEntraAdminSetupHtml() {
  var cfg = state.entraConfig || {};
  var readOnly = typeof isUsersReadOnlyForCurrentUser === 'function' && isUsersReadOnlyForCurrentUser();
  var redirect = getEntraRedirectUri();
  return '<div class="entra-setup-card">'
    + '<div class="entra-setup-head">'
    + '<div><div class="entra-setup-title">Microsoft Entra ID sign-in</div>'
    + '<div class="entra-setup-sub">Replace demo profile picking with real work-account login. Register a single-page app in Entra and paste the Application (client) ID below.</div></div>'
    + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (cfg.enabled ? ' checked' : '') + (readOnly ? ' disabled' : '') + ' onchange="setEntraConfigField(\'enabled\',this.checked);setTimeout(renderUsersTab,0);"><span class="fw-toggle-track"></span></label>'
    + '</div>'
    + (cfg.enabled
      ? '<div class="entra-setup-fields">'
        + '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Application (client) ID</label>'
        + '<input class="form-input" placeholder="00000000-0000-0000-0000-000000000000" value="' + escapeHTML(cfg.clientId || '') + '"' + (readOnly ? ' disabled' : ' oninput="setEntraConfigField(\'clientId\',this.value);"') + '>'
        + '<div class="form-hint">From Azure portal → Entra ID → App registrations → your app → Overview.</div></div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
        + '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Directory (tenant) ID</label>'
        + '<input class="form-input" placeholder="organizations" value="' + escapeHTML(cfg.tenantId || 'organizations') + '"' + (readOnly ? ' disabled' : ' oninput="setEntraConfigField(\'tenantId\',this.value);"') + '>'
        + '<div class="form-hint">Your tenant GUID, or <code>organizations</code> for any work account.</div></div>'
        + '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Redirect URI (read-only)</label>'
        + '<input class="form-input" readonly value="' + escapeHTML(redirect) + '" style="background:#f5f5f7;">'
        + '<div class="form-hint">Add this exact URI under Authentication → SPA redirect URIs in your app registration.</div></div>'
        + '</div>'
        + '<details class="entra-setup-help"><summary>Setup checklist</summary>'
        + '<ol><li>Entra ID → App registrations → New registration → Single-page application.</li>'
        + '<li>Add the redirect URI shown above.</li>'
        + '<li>API permissions: Microsoft Graph → delegated → <code>User.Read</code>, <code>openid</code>, <code>profile</code>, <code>email</code>.</li>'
        + '<li>Grant admin consent if your tenant requires it.</li>'
        + '<li>Add each user\'s work email in the roster below — sign-in matches on email.</li></ol></details>'
        + '</div>'
      : '<div class="entra-setup-off">Enable to let control owners and policy leads sign in with Microsoft instead of picking a demo profile.</div>')
    + '</div>';
}

function renderEntraSetupCardHtml() {
  if (typeof isUsersReadOnlyForCurrentUser === 'function' && isUsersReadOnlyForCurrentUser() && !isEntraAuthEnabled()) return '';
  var cfg = state.entraConfig || {};
  return '<div class="entra-setup-card entra-setup-card-compact">'
    + '<div class="entra-setup-head">'
    + '<div><div class="entra-setup-title">Microsoft Entra ID</div>'
    + '<div class="entra-setup-sub">Optional work-account sign-in instead of demo profile picking.</div></div>'
    + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (cfg.enabled ? ' checked' : '') + ' onchange="setEntraConfigField(\'enabled\',this.checked);if(typeof refreshCurrentCisoStep===\'function\')refreshCurrentCisoStep();"><span class="fw-toggle-track"></span></label>'
    + '</div>'
    + (cfg.enabled
      ? '<p style="font-size:13px;color:var(--text-muted);margin:0;">Configure app registration details under <button type="button" class="btn-link" onclick="showTab(\'users\')">Users &amp; roles</button>. Users must have their Microsoft email on the roster.</p>'
      : '')
    + '</div>';
}
