// js/cloud-auth.js — Multi-user cloud mode: email/password sign-in and cross-computer
// data sync, backed by Supabase. Loaded after core.js / admin.js.
//
// Backend contract: supabase/schema.sql (table `programs`, email-roster RLS).
// Globals only, defensive typeof guards — same conventions as the rest of js/.

// ── transient session globals (NOT persisted into program state) ────────────
var __sbClient = null;            // Supabase client (lazily created)
var __cloudSession = null;        // current Supabase auth session
var __cloudProgramId = null;      // id of the loaded program row
var __cloudProgramOwnerId = null; // owner_id of that row (for "is owner" checks)
var __cloudLocked = false;        // true once signed in -> impersonation disabled
var __cloudRealtimeChannel = null;
var __cloudPushTimer = null;
var __cloudLastPushedFingerprint = null;
var __cloudSuppressRealtimeUntil = 0;
var __sbLoadPromise = null;
var __cloudEntered = false;   // true once a program is loaded for the session
var __cloudEntering = false;  // re-entrancy guard for enterCloudWithSession

// ── configuration / capability checks ───────────────────────────────────────
function isCloudConfigured() {
  return typeof CLOUD_CONFIG === 'object' && CLOUD_CONFIG
    && !!String(CLOUD_CONFIG.supabaseUrl || '').trim()
    && !!String(CLOUD_CONFIG.supabaseAnonKey || '').trim();
}

// Cloud mode is "enabled" whenever it's configured. The Supabase library is
// loaded lazily on demand (see loadSupabaseScript) so the public demo never
// pulls a third-party script.
function isCloudEnabled() {
  return isCloudConfigured();
}

// Lazily inject the Supabase JS client from CDN — only ever called when cloud
// mode is configured (mirrors the MSAL loader in entra-auth.js).
function loadSupabaseScript() {
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    return Promise.resolve();
  }
  if (__sbLoadPromise) return __sbLoadPromise;
  __sbLoadPromise = new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.async = true;
    s.onload = function() { resolve(); };
    s.onerror = function() { reject(new Error('Failed to load the Supabase library.')); };
    document.head.appendChild(s);
  });
  return __sbLoadPromise;
}

function isCloudSessionActive() {
  return !!(__cloudSession && __cloudProgramId);
}

// Other modules call this to know whether to hide the demo role-picker.
function isCloudLocked() {
  return !!__cloudLocked;
}

function isCloudProgramOwner() {
  return !!(__cloudProgramOwnerId && __cloudSession && __cloudProgramOwnerId === __cloudSession.user.id);
}

/** Local demo admin (role picker) — not signed in via cloud. */
function isLocalDemoAdminMode() {
  return !state.currentUserId && !isCloudSessionActive();
}

/** Cloud sign-in as program owner (full oversight, no role picker). */
function isCloudOwnerSession() {
  return !state.currentUserId && isCloudProgramOwner();
}

/** Best display name for attestations / submissions in the current session. */
function getSessionActorName(fallback) {
  if (state.currentUserId && state.users) {
    var u = state.users.find(function(x) { return x.id === state.currentUserId; });
    if (u && u.name) return u.name;
  }
  if (isCloudSessionActive()) {
    var cn = getCloudSessionName();
    if (cn) return cn;
    var ce = getCloudSessionEmail();
    if (ce) return ce.split('@')[0];
  }
  return fallback || state.programOwner || 'Program Owner';
}

function getControlWorkspaceTitle() {
  if (state.currentUserId) return 'My Controls';
  if (isCloudOwnerSession()) return 'Control design queue';
  if (isLocalDemoAdminMode()) return 'Control Library';
  return 'Controls';
}

function canReassignProgramWork() {
  if (!state.currentUserId) return true;
  var user = (state.users || []).find(function(u) { return u.id === state.currentUserId; });
  if (!user) return false;
  return user.role === 'ciso' || user.role === 'admin';
}

function getCloudClient() {
  if (__sbClient) return __sbClient;
  if (!isCloudConfigured()) return null;
  if (typeof window === 'undefined' || !window.supabase || !window.supabase.createClient) return null;
  __sbClient = window.supabase.createClient(
    String(CLOUD_CONFIG.supabaseUrl).trim(),
    String(CLOUD_CONFIG.supabaseAnonKey).trim(),
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } }
  );
  return __sbClient;
}

function getCloudRedirectUri() {
  try {
    return window.location.href.split('#')[0].split('?')[0];
  } catch (e) {
    return window.location.origin + '/app.html';
  }
}

function getCloudAppUrl() {
  var cfg = (typeof CLOUD_CONFIG === 'object' && CLOUD_CONFIG) ? CLOUD_CONFIG : {};
  var configured = String(cfg.appUrl || '').trim();
  if (configured) return configured;
  return getCloudRedirectUri();
}

// Notify a custom ISP approver (cloud mode) via Supabase Auth magic link.
// Works for any approver address when the Send Email hook is off (default after configure script).
async function sendISPApprovalRequestEmail(opts) {
  if (!isCloudSessionActive()) return { ok: false, reason: 'not_cloud' };
  var sb = getCloudClient();
  if (!sb || !sb.auth || typeof sb.auth.signInWithOtp !== 'function') {
    return { ok: false, reason: 'no_client' };
  }
  opts = opts || {};
  var approverEmail = String(opts.approverEmail || '').trim().toLowerCase();
  if (!approverEmail || approverEmail.indexOf('@') < 0) return { ok: false, reason: 'no_email' };
  var approverName = String(opts.approverName || '').trim();
  var programOwnerName = String(opts.programOwnerName || '').trim();
  var orgName = String(opts.orgName || '').trim();
  var appUrl = getCloudAppUrl();

  function formatAuthError(err) {
    if (!err) return 'sign-in email failed';
    if (typeof err === 'string') return err;
    var msg = err.message || err.msg || err.error_description || err.code || '';
    if (msg && String(msg) !== '{}') return String(msg);
    return 'sign-in email failed — disable Authentication → Hooks → Send Email if the hook is misconfigured';
  }

  try {
    var res = await sb.auth.signInWithOtp({
      email: approverEmail,
      options: {
        emailRedirectTo: appUrl,
        shouldCreateUser: true,
        data: {
          isp_approver_invite: true,
          approver_name: approverName,
          org_name: orgName,
          invited_by: programOwnerName
        }
      }
    });
    if (res && res.error) {
      console.warn('sendISPApprovalRequestEmail signInWithOtp', res.error);
      return { ok: false, reason: formatAuthError(res.error) };
    }
    return { ok: true, method: 'supabase_auth' };
  } catch (e) {
    console.warn('sendISPApprovalRequestEmail', e);
    return { ok: false, reason: String(e && e.message ? e.message : e) };
  }
}

function formatApproverEmailFailure(reason) {
  var r = String(reason || '').toLowerCase();
  if (r.indexOf('only send testing') >= 0 || r.indexOf('your own email') >= 0
      || r.indexOf('validation_error') >= 0 || r.indexOf('sendgrid') >= 0) {
    return 'Send Email hook may be misconfigured. Re-run Configure Supabase approver email (no SendGrid secrets) to use built-in mail, or set up SendGrid with your verified Gmail.';
  }
  if (r.indexOf('rate limit') >= 0 || r.indexOf('too many') >= 0) {
    return 'Email rate limit — wait a minute and try again.';
  }
  if (r.indexOf('redirect') >= 0 && r.indexOf('url') >= 0) {
    return 'Add app.html to Supabase Auth → URL configuration → Redirect URLs.';
  }
  if (r.indexOf('hook') >= 0) {
    return 'Supabase Send Email hook may be misconfigured. Run Actions → Configure Supabase approver email to reset to built-in mail.';
  }
  return reason || 'unknown error';
}

function getCloudSessionEmail() {
  try {
    var u = __cloudSession && __cloudSession.user;
    if (!u) return '';
    return String(u.email || (u.user_metadata && u.user_metadata.email) || '').trim();
  } catch (e) { return ''; }
}

function getCloudSessionName() {
  try {
    var u = __cloudSession && __cloudSession.user;
    if (!u) return '';
    var m = u.user_metadata || {};
    return String(m.full_name || m.name || (getCloudSessionEmail().split('@')[0]) || 'User').trim();
  } catch (e) { return 'User'; }
}

// ── sign-in gate UI ──────────────────────────────────────────────────────────
// Show only the sign-in methods that are turned on in CLOUD_CONFIG.
function renderCloudGateMethods() {
  var cfg = (typeof CLOUD_CONFIG === 'object' && CLOUD_CONFIG) || {};
  var password = !!cfg.enableEmailPassword;
  var magic = !password && cfg.enableMagicLink !== false;
  var ms = !!cfg.enableMicrosoft;
  var gg = !!cfg.enableGoogle;
  var elPassword = document.getElementById('cloudGatePasswordForm');
  if (elPassword) elPassword.style.display = password ? '' : 'none';
  var elMagic = document.getElementById('cloudGateMagicLink');
  if (elMagic) elMagic.style.display = magic ? '' : 'none';
  var elMs = document.getElementById('cloudGateMsBtn');
  if (elMs) elMs.style.display = ms ? '' : 'none';
  var elGg = document.getElementById('cloudGateGoogleBtn');
  if (elGg) elGg.style.display = gg ? '' : 'none';
  var elBtns = document.getElementById('cloudGateButtons');
  if (elBtns) elBtns.style.display = (ms || gg) ? '' : 'none';
  var elDiv = document.getElementById('cloudGateDivider');
  if (elDiv) elDiv.style.display = ((password || magic) && (ms || gg)) ? '' : 'none';
}

function showCloudSignInGate(message) {
  var gate = document.getElementById('cloudSignInGate');
  if (!gate) return;
  renderCloudGateMethods();
  var msg = document.getElementById('cloudGateMessage');
  if (msg) {
    // Reset inline styles so the CSS warning style applies.
    msg.style.color = '';
    msg.style.background = '';
    if (message) { msg.textContent = message; msg.style.display = ''; }
    else { msg.textContent = ''; msg.style.display = 'none'; }
  }
  gate.style.display = 'flex';
}

// Friendly (non-warning) confirmation inside the gate, e.g. "check your email".
function showCloudGateInfo(text) {
  var msg = document.getElementById('cloudGateMessage');
  if (!msg) return;
  msg.textContent = text;
  msg.style.display = '';
  msg.style.color = '#065f46';
  msg.style.background = '#d1fae5';
}

// Errors must appear inside the gate — global showToast sits behind #cloudSignInGate.
function showCloudGateError(text) {
  var msg = document.getElementById('cloudGateMessage');
  if (!msg) return;
  msg.textContent = text;
  msg.style.display = '';
  msg.style.color = '#991b1b';
  msg.style.background = '#fee2e2';
}

function clearCloudGateMessage() {
  var msg = document.getElementById('cloudGateMessage');
  if (!msg) return;
  msg.textContent = '';
  msg.style.display = 'none';
  msg.style.color = '';
  msg.style.background = '';
}

function hideCloudSignInGate() {
  var gate = document.getElementById('cloudSignInGate');
  if (gate) gate.style.display = 'none';
}

function setCloudGateBusy(busy, label) {
  var wrap = document.getElementById('cloudGateButtons');
  if (wrap) {
    wrap.style.opacity = busy ? '0.5' : '';
    wrap.style.pointerEvents = busy ? 'none' : '';
  }
  var form = document.getElementById('cloudGatePasswordForm');
  if (form) {
    form.style.opacity = busy ? '0.5' : '';
    form.style.pointerEvents = busy ? 'none' : '';
  }
  var status = document.getElementById('cloudGateStatus');
  if (status) {
    status.textContent = busy ? (label || 'Working…') : '';
    status.style.display = busy ? '' : 'none';
  }
}

function getCloudGateCredentials() {
  var emailEl = document.getElementById('cloudGateEmail');
  var passEl = document.getElementById('cloudGatePassword');
  var email = String((emailEl && emailEl.value) || '').trim();
  var password = String((passEl && passEl.value) || '');
  return { email: email, password: password };
}

function validateCloudGateEmail(email) {
  return !!email && email.indexOf('@') >= 1 && email.indexOf('.') >= 0;
}

function formatCloudAuthError(err, fallback) {
  var msg = String((err && err.message) || fallback || 'unknown error').toLowerCase();
  if (msg.indexOf('rate limit') >= 0 || msg.indexOf('too many requests') >= 0) {
    return 'Supabase has temporarily blocked auth emails for this project (rate limit). '
      + 'Wait about an hour, then try Sign in instead of Create one — your account may already exist from an earlier attempt.';
  }
  if (msg.indexOf('invalid login credentials') >= 0) {
    return 'Wrong email or password. If you just created an account, confirm the email from your inbox first, then sign in.';
  }
  if (msg.indexOf('user already registered') >= 0) {
    return 'An account with this email already exists. Use Sign in instead.';
  }
  return (err && err.message) || fallback || 'unknown error';
}

// ── OAuth sign-in ────────────────────────────────────────────────────────────
async function signInWithProvider(provider) {
  var sb = getCloudClient();
  if (!sb) {
    if (typeof showToast === 'function') showToast('Cloud sign-in is not configured.', true);
    return;
  }
  try {
    setCloudGateBusy(true, 'Redirecting to ' + (provider === 'azure' ? 'Microsoft' : 'Google') + '…');
    var scopes = provider === 'azure' ? 'openid profile email' : 'email profile';
    var res = await sb.auth.signInWithOAuth({
      provider: provider,
      options: { redirectTo: getCloudRedirectUri(), scopes: scopes }
    });
    if (res && res.error) throw res.error;
    // On success the browser is redirected away; nothing else to do here.
  } catch (err) {
    setCloudGateBusy(false);
    console.warn('signInWithProvider', err);
    if (typeof showToast === 'function') {
      showToast('Sign-in could not start: ' + ((err && err.message) || 'unknown error'), true);
    }
  }
}
function signInWithMicrosoft() { return signInWithProvider('azure'); }
function signInWithGoogle() { return signInWithProvider('google'); }

async function signInWithPassword() {
  var sb = getCloudClient();
  if (!sb) {
    showCloudGateError('Cloud sign-in is not configured.');
    return;
  }
  var creds = getCloudGateCredentials();
  if (!validateCloudGateEmail(creds.email)) {
    showCloudGateError('Enter a valid email address.');
    return;
  }
  if (!creds.password) {
    showCloudGateError('Enter your password.');
    return;
  }
  try {
    clearCloudGateMessage();
    setCloudGateBusy(true, 'Signing in…');
    var res = await sb.auth.signInWithPassword({ email: creds.email, password: creds.password });
    if (res && res.error) throw res.error;
    if (res && res.data && res.data.session) {
      await enterCloudWithSession(res.data.session);
    } else {
      throw new Error('No session returned.');
    }
  } catch (err) {
    console.warn('signInWithPassword', err);
    showCloudGateError('Sign-in failed: ' + formatCloudAuthError(err, 'check your email and password.'));
  } finally {
    setCloudGateBusy(false);
  }
}

async function signUpWithPassword() {
  var sb = getCloudClient();
  if (!sb) {
    showCloudGateError('Cloud sign-in is not configured.');
    return;
  }
  var creds = getCloudGateCredentials();
  if (!validateCloudGateEmail(creds.email)) {
    showCloudGateError('Enter a valid email address.');
    return;
  }
  if (creds.password.length < 6) {
    showCloudGateError('Choose a password with at least 6 characters.');
    return;
  }
  try {
    clearCloudGateMessage();
    setCloudGateBusy(true, 'Creating your account…');
    var res = await sb.auth.signUp({
      email: creds.email,
      password: creds.password,
      options: { emailRedirectTo: getCloudRedirectUri() }
    });
    if (res && res.error) throw res.error;
    var user = res && res.data ? res.data.user : null;
    var identities = user && user.identities ? user.identities : null;
    if (user && (!identities || identities.length === 0)) {
      showCloudGateError('An account with this email already exists. Sign in instead, or check your inbox if you still need to confirm your email.');
      return;
    }
    if (res && res.data && res.data.session) {
      await enterCloudWithSession(res.data.session);
      return;
    }
    showCloudGateInfo('Account created for ' + creds.email + '. Check your inbox if email confirmation is enabled, then sign in.');
  } catch (err) {
    console.warn('signUpWithPassword', err);
    showCloudGateError(formatCloudAuthError(err, 'Could not create account.'));
  } finally {
    setCloudGateBusy(false);
  }
}

// Passwordless email sign-in — kept for legacy config; disabled by default.
async function sendMagicLink() {
  var sb = getCloudClient();
  if (!sb) {
    if (typeof showToast === 'function') showToast('Cloud sign-in is not configured.', true);
    return;
  }
  var input = document.getElementById('cloudGateEmail');
  var email = String((input && input.value) || '').trim();
  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
    showCloudGateError('Enter a valid email address.');
    return;
  }
  try {
    setCloudGateBusy(true, 'Sending your sign-in link…');
    var res = await sb.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: getCloudRedirectUri() }
    });
    if (res && res.error) throw res.error;
    setCloudGateBusy(false);
    showCloudGateInfo('Check ' + email + ' for a sign-in link, then open it on this device. You can close this tab in the meantime.');
  } catch (err) {
    setCloudGateBusy(false);
    console.warn('sendMagicLink', err);
    showCloudGateError('Could not send the link: ' + ((err && err.message) || 'unknown error'));
  }
}

async function signOutCloud() {
  var sb = getCloudClient();
  try { if (sb) await sb.auth.signOut(); } catch (e) { /* ignore */ }
  teardownCloudRealtime();
  __cloudSession = null;
  __cloudProgramId = null;
  __cloudProgramOwnerId = null;
  __cloudLocked = false;
  try { document.body.classList.remove('cloud-session-active'); } catch (e) { /* ignore */ }
  // Close any open account/role menu, then reload to a clean gate.
  var overlay = document.getElementById('rolePickerOverlay');
  if (overlay) overlay.style.display = 'none';
  try { window.location.reload(); } catch (e) { showCloudSignInGate(); }
}

// ── account menu (replaces the demo role-picker once signed in) ──────────────
function showCloudAccountMenu() {
  var overlay = document.getElementById('rolePickerOverlay');
  if (!overlay) return;
  var sub = document.getElementById('rolePickerSubtitle');
  if (sub) sub.textContent = 'You are signed in. Your access is tied to your account — switching identities is disabled.';
  var adminBtn = document.getElementById('rolePickerAdminBtn');
  if (adminBtn) adminBtn.style.display = 'none';
  var entra = document.getElementById('entraAuthPickerSection');
  if (entra) { entra.innerHTML = ''; entra.style.display = 'none'; }
  var roleLabel = '';
  try {
    var u = state.currentUserId ? (state.users || []).find(function(x){ return x.id === state.currentUserId; }) : null;
    roleLabel = u && typeof getProgramRoleMeta === 'function' ? getProgramRoleMeta(u.role).label
      : (__cloudProgramOwnerId && __cloudSession && __cloudProgramOwnerId === __cloudSession.user.id ? 'Program owner' : '');
  } catch (e) { /* ignore */ }
  var profiles = document.getElementById('rolePickerProfiles');
  if (profiles) {
    profiles.innerHTML = '<div class="cloud-account-card">'
      + '<div class="cloud-account-name">' + escapeHTML(getCloudSessionName()) + '</div>'
      + '<div class="cloud-account-email">' + escapeHTML(getCloudSessionEmail()) + '</div>'
      + (roleLabel ? '<div class="cloud-account-role">' + escapeHTML(roleLabel) + '</div>' : '')
      + '<button type="button" class="btn btn-secondary btn-sm" style="margin-top:14px;" onclick="signOutCloud()">Sign out</button>'
      + '</div>';
  }
  overlay.style.display = 'flex';
}

// ── program load / create ────────────────────────────────────────────────────
function cloudUid() {
  try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
  return 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Build a fresh program seeded with the owner already on the roster, so role
// matching works on their next sign-in and they get full (owner) access.
function buildSeedProgramState() {
  var seed = JSON.parse(JSON.stringify(STATE_DEFAULTS));
  var name = getCloudSessionName();
  var email = getCloudSessionEmail();
  seed.users = [{ id: cloudUid(), name: name, email: email, role: 'ciso', families: [], controls: [], note: 'Program owner (created this program)' }];
  seed.programOwner = name;
  seed.programOwnerEmail = email;
  return seed;
}

async function loadOrCreateCloudProgram() {
  var sb = getCloudClient();
  if (!sb) return false;

  // RLS already restricts rows to programs we own or are rostered on.
  var sel = await sb.from('programs').select('*').order('updated_at', { ascending: false });
  if (sel.error) {
    console.warn('load programs', sel.error);
    showCloudSignInGate('Could not reach the database. Check your connection and try again.');
    return false;
  }
  var rows = sel.data || [];
  var myId = __cloudSession.user.id;
  var row = rows.filter(function(r) { return r.owner_id === myId; })[0] || rows[0] || null;

  if (!row) {
    // First time for this account and not yet invited anywhere -> create one.
    var ins = await sb.from('programs')
      .insert({ name: (getCloudSessionName() + "'s GRC Program"), owner_id: myId, state: buildSeedProgramState() })
      .select()
      .single();
    if (ins.error) {
      console.warn('create program', ins.error);
      showCloudSignInGate('Signed in, but no program is associated with ' + getCloudSessionEmail()
        + '. Ask your program owner to add this email under Users & roles.');
      return false;
    }
    row = ins.data;
  }

  applyCloudProgramRow(row);
  return true;
}

function applyCloudProgramRow(row) {
  __cloudProgramId = row.id;
  __cloudProgramOwnerId = row.owner_id;
  if (row.state && typeof applyLoadedState === 'function') applyLoadedState(row.state);
  rememberCloudLocalFingerprint();
  // Mirror into localStorage as an offline cache for this browser.
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedPayload())); } catch (e) {}
  __cloudLocked = true;
  try { document.body.classList.add('cloud-session-active'); } catch (e) { /* ignore */ }
  mapCloudIdentityToRoleView();
  subscribeCloudRealtime();
}

// Lock the view to the signed-in person's real role (no impersonation).
function mapCloudIdentityToRoleView() {
  var isOwner = __cloudProgramOwnerId && __cloudSession && __cloudProgramOwnerId === __cloudSession.user.id;
  var matched = null;
  if (typeof findProgramUserForEntraIdentity === 'function') {
    matched = findProgramUserForEntraIdentity(getCloudSessionEmail(), getCloudSessionName());
  }
  if (isOwner) {
    // The owner administers the program: full access (all tabs).
    if (typeof applyRoleView === 'function') applyRoleView('admin');
  } else if (matched) {
    if (typeof applyRoleView === 'function') applyRoleView(matched.id);
    if (typeof maybePromptProfileSetup === 'function') maybePromptProfileSetup(matched);
  } else {
    // Rostered (RLS let us in) but no exact match — fall back to read-only-ish reports.
    if (typeof applyRoleView === 'function') applyRoleView('admin');
  }
  // Make the top-left profile button reflect the signed-in identity (name/email)
  // and a sign-out hint, instead of the generic "Admin mode / impersonate".
  try {
    var btn = document.getElementById('profileBtn');
    if (btn) {
      var u = state.currentUserId ? (state.users || []).find(function(x) { return x.id === state.currentUserId; }) : null;
      if (typeof renderProfileButtonContent === 'function') btn.innerHTML = renderProfileButtonContent(u);
      btn.title = 'Signed in as ' + (getCloudSessionName() || getCloudSessionEmail()) + ' — click to sign out';
      btn.setAttribute('aria-label', btn.title);
    }
  } catch (e) { /* ignore */ }
}

// ── save / sync ──────────────────────────────────────────────────────────────
// Called from core.js saveToStorage() whenever a debounced save fires.
function cloudPushDebounced() {
  if (!isCloudSessionActive()) return;
  if (__cloudPushTimer) clearTimeout(__cloudPushTimer);
  __cloudPushTimer = setTimeout(function() {
    __cloudPushTimer = null;
    cloudPushNow();
  }, 1000);
}

function cloudNormalizedPayload(raw) {
  var payload = {};
  if (typeof STATE_ALLOWED_KEYS === 'undefined' || !STATE_ALLOWED_KEYS) return raw || {};
  STATE_ALLOWED_KEYS.forEach(function(k) {
    payload[k] = raw ? raw[k] : undefined;
  });
  return payload;
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(function(item) { return stableStringify(item); }).join(',') + ']';
  }
  return '{' + Object.keys(value).sort().map(function(key) {
    return JSON.stringify(key) + ':' + stableStringify(value[key]);
  }).join(',') + '}';
}

function cloudStateFingerprint(raw) {
  try { return stableStringify(cloudNormalizedPayload(raw || {})); } catch (e) { return ''; }
}

function rememberCloudLocalFingerprint() {
  try { __cloudLastPushedFingerprint = cloudStateFingerprint(state); } catch (e) { /* ignore */ }
}

function cloudRefreshUiAfterRemoteUpdate() {
  try { if (typeof renderSidebarBadges === 'function') renderSidebarBadges(); } catch (e) { /* ignore */ }
  try { if (typeof applySetupFocusMode === 'function') applySetupFocusMode(); } catch (e) { /* ignore */ }
  var active = document.querySelector('.tab-panel.active');
  if (!active || !active.id) return;
  var tabId = active.id.replace(/^tab-/, '');
  if (typeof showTab === 'function') showTab(tabId);
}

async function cloudPushNow() {
  if (!isCloudSessionActive()) return;
  var sb = getCloudClient();
  if (!sb) return;
  try {
    var payload = typeof buildPersistedPayload === 'function' ? buildPersistedPayload() : null;
    if (!payload) return;
    __cloudSuppressRealtimeUntil = Date.now() + 4000;
    __cloudLastPushedFingerprint = cloudStateFingerprint(state);
    var res = await sb.from('programs')
      .update({ state: payload, name: (state.orgName || 'GRC Program') })
      .eq('id', __cloudProgramId);
    if (res.error) console.warn('cloudPushNow', res.error);
  } catch (e) {
    console.warn('cloudPushNow', e);
  }
}

// ── realtime (best-effort) ───────────────────────────────────────────────────
function subscribeCloudRealtime() {
  teardownCloudRealtime();
  var sb = getCloudClient();
  if (!sb || !__cloudProgramId || !sb.channel) return;
  try {
    __cloudRealtimeChannel = sb.channel('program-' + __cloudProgramId)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'programs', filter: 'id=eq.' + __cloudProgramId },
        function(payload) {
          // Only refresh when this browser has no unsaved edits, so we never
          // clobber in-progress work with a remote update.
          if (window.isDirty) return;
          if (Date.now() < __cloudSuppressRealtimeUntil) return;
          if (!(payload && payload.new && payload.new.state && typeof applyLoadedState === 'function')) return;
          var incoming = payload.new.state;
          var incomingFp = cloudStateFingerprint(incoming);
          if (incomingFp === __cloudLastPushedFingerprint) return;
          var localFp = cloudStateFingerprint(state);
          if (incomingFp === localFp) return;
          applyLoadedState(incoming);
          rememberCloudLocalFingerprint();
          cloudRefreshUiAfterRemoteUpdate();
          if (typeof showToast === 'function') showToast('Program updated by another user.');
        })
      .subscribe();
  } catch (e) {
    console.warn('subscribeCloudRealtime', e);
  }
}

function teardownCloudRealtime() {
  try {
    if (__cloudRealtimeChannel && __sbClient) __sbClient.removeChannel(__cloudRealtimeChannel);
  } catch (e) { /* ignore */ }
  __cloudRealtimeChannel = null;
}

// Strip auth tokens (#access_token=…, ?code=…) from the address bar after sign-in.
function cleanCloudUrl() {
  try {
    if (window.location.hash || window.location.search) {
      var clean = window.location.href.split('#')[0].split('?')[0];
      window.history.replaceState({}, document.title, clean);
    }
  } catch (e) { /* ignore */ }
}

// Idempotently bring a signed-in session into the app (load program, lock view).
// Called from both getSession() and onAuthStateChange so a magic-link return is
// never missed regardless of timing.
async function enterCloudWithSession(session) {
  if (!session || __cloudEntered || __cloudEntering) return false;
  __cloudEntering = true;
  __cloudSession = session;
  setCloudGateBusy(true, 'Loading your program…');
  var ok = false;
  try { ok = await loadOrCreateCloudProgram(); } catch (e) { console.warn('loadOrCreateCloudProgram', e); }
  __cloudEntering = false;
  if (ok) {
    __cloudEntered = true;
    hideCloudSignInGate();
    cleanCloudUrl();
    if (typeof bootAfterStateReady === 'function') bootAfterStateReady();
  }
  setCloudGateBusy(false);
  return ok;
}

// ── boot entry point (called from app.js DOMContentLoaded) ──────────────────
async function initCloudAuth() {
  if (!isCloudEnabled()) return false;
  try {
    await loadSupabaseScript();
  } catch (e) {
    console.warn('loadSupabaseScript', e);
    showCloudSignInGate('Could not load the sign-in library. Check your connection and try again.');
    return false;
  }
  var sb = getCloudClient();
  if (!sb) {
    showCloudSignInGate('Sign-in is misconfigured.');
    return false;
  }

  // Catch sign-in that completes asynchronously (magic-link URL processing,
  // token refresh, or sign-in from another tab) as well as sign-out.
  try {
    sb.auth.onAuthStateChange(function(event, session) {
      if (event === 'SIGNED_OUT') { __cloudSession = null; __cloudEntered = false; return; }
      if (session && !__cloudEntered) { enterCloudWithSession(session); }
    });
  } catch (e) { /* ignore */ }

  var got = null;
  try { got = await sb.auth.getSession(); } catch (e) { console.warn('getSession', e); }
  var session = got && got.data ? got.data.session : null;
  if (session) return enterCloudWithSession(session);

  // No session yet, but if the URL carries auth params (just clicked the email
  // link) give detectSessionInUrl a moment to fire onAuthStateChange before we
  // fall back to showing the gate.
  if (/[#&?](access_token|refresh_token|code=|type=)/.test(window.location.href)) {
    setCloudGateBusy(true, 'Finishing sign-in…');
    setTimeout(function() {
      if (!__cloudEntered) { setCloudGateBusy(false); showCloudSignInGate(); }
    }, 5000);
    return false;
  }

  showCloudSignInGate();
  return false;
}

// ── exports ──────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.isCloudConfigured = isCloudConfigured;
  window.isCloudEnabled = isCloudEnabled;
  window.isCloudSessionActive = isCloudSessionActive;
  window.isCloudLocked = isCloudLocked;
  window.isCloudProgramOwner = isCloudProgramOwner;
  window.isLocalDemoAdminMode = isLocalDemoAdminMode;
  window.isCloudOwnerSession = isCloudOwnerSession;
  window.getSessionActorName = getSessionActorName;
  window.getControlWorkspaceTitle = getControlWorkspaceTitle;
  window.canReassignProgramWork = canReassignProgramWork;
  window.signInWithMicrosoft = signInWithMicrosoft;   // overrides the legacy Entra one
  window.signInWithGoogle = signInWithGoogle;
  window.signInWithPassword = signInWithPassword;
  window.signUpWithPassword = signUpWithPassword;
  window.sendMagicLink = sendMagicLink;
  window.signOutCloud = signOutCloud;
  window.showCloudAccountMenu = showCloudAccountMenu;
  window.cloudPushDebounced = cloudPushDebounced;
  window.cloudPushNow = cloudPushNow;
  window.initCloudAuth = initCloudAuth;
  window.sendISPApprovalRequestEmail = sendISPApprovalRequestEmail;
  window.formatApproverEmailFailure = formatApproverEmailFailure;
  window.getCloudAppUrl = getCloudAppUrl;
}
