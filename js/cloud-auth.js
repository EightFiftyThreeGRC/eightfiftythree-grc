// js/cloud-auth.js — Multi-user cloud mode: real OAuth sign-in (Microsoft + Google)
// and cross-computer data sync, backed by Supabase. Loaded after core.js / admin.js.
//
// When CLOUD_CONFIG is blank the whole module no-ops and the app runs exactly as
// before (single-user, localStorage only). When configured:
//   1. A full-screen sign-in gate replaces the demo role-picker.
//   2. "Sign in with Microsoft / Google" -> Supabase OAuth (redirect flow).
//   3. The signed-in identity is matched to ONE real roster person -> their role.
//      No impersonation: you are locked to your own authenticated identity.
//   4. The program lives in a shared Postgres row; edits sync to every computer.
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
var __sbLoadPromise = null;

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

function getCloudClient() {
  if (__sbClient) return __sbClient;
  if (!isCloudConfigured()) return null;
  if (typeof window === 'undefined' || !window.supabase || !window.supabase.createClient) return null;
  __sbClient = window.supabase.createClient(
    String(CLOUD_CONFIG.supabaseUrl).trim(),
    String(CLOUD_CONFIG.supabaseAnonKey).trim(),
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
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
  var magic = cfg.enableMagicLink !== false;
  var ms = !!cfg.enableMicrosoft;
  var gg = !!cfg.enableGoogle;
  var elMagic = document.getElementById('cloudGateMagicLink');
  if (elMagic) elMagic.style.display = magic ? '' : 'none';
  var elMs = document.getElementById('cloudGateMsBtn');
  if (elMs) elMs.style.display = ms ? '' : 'none';
  var elGg = document.getElementById('cloudGateGoogleBtn');
  if (elGg) elGg.style.display = gg ? '' : 'none';
  var elBtns = document.getElementById('cloudGateButtons');
  if (elBtns) elBtns.style.display = (ms || gg) ? '' : 'none';
  var elDiv = document.getElementById('cloudGateDivider');
  if (elDiv) elDiv.style.display = (magic && (ms || gg)) ? '' : 'none';
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

function hideCloudSignInGate() {
  var gate = document.getElementById('cloudSignInGate');
  if (gate) gate.style.display = 'none';
}

function setCloudGateBusy(busy, label) {
  var wrap = document.getElementById('cloudGateButtons');
  if (wrap) wrap.style.opacity = busy ? '0.5' : '';
  var status = document.getElementById('cloudGateStatus');
  if (status) {
    status.textContent = busy ? (label || 'Working…') : '';
    status.style.display = busy ? '' : 'none';
  }
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

// Passwordless email sign-in — no OAuth app registration required.
async function sendMagicLink() {
  var sb = getCloudClient();
  if (!sb) {
    if (typeof showToast === 'function') showToast('Cloud sign-in is not configured.', true);
    return;
  }
  var input = document.getElementById('cloudGateEmail');
  var email = String((input && input.value) || '').trim();
  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
    if (typeof showToast === 'function') showToast('Enter a valid email address.', true);
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
    if (typeof showToast === 'function') {
      showToast('Could not send the link: ' + ((err && err.message) || 'unknown error'), true);
    }
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
  // Mirror into localStorage as an offline cache for this browser.
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedPayload())); } catch (e) {}
  __cloudLocked = true;
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

async function cloudPushNow() {
  if (!isCloudSessionActive()) return;
  var sb = getCloudClient();
  if (!sb) return;
  try {
    var payload = typeof buildPersistedPayload === 'function' ? buildPersistedPayload() : null;
    if (!payload) return;
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
          if (payload && payload.new && payload.new.state && typeof applyLoadedState === 'function') {
            applyLoadedState(payload.new.state);
            if (typeof bootAfterStateReady === 'function') bootAfterStateReady();
            if (typeof showToast === 'function') showToast('Program updated by another user.');
          }
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

// ── boot entry point (called from app.js DOMContentLoaded) ──────────────────
async function initCloudAuth() {
  if (!isCloudEnabled()) return false;
  try {
    await loadSupabaseScript();
  } catch (e) {
    console.warn('loadSupabaseScript', e);
    showCloudSignInGate('Could not load the sign-in library. Check your connection, or continue in local demo mode.');
    return false;
  }
  var sb = getCloudClient();
  if (!sb) {
    showCloudSignInGate('Sign-in is misconfigured. Continue in local demo mode for now.');
    return false;
  }

  // React to future auth changes (e.g. token refresh / sign-out in another tab).
  try {
    sb.auth.onAuthStateChange(function(event, session) {
      if (event === 'SIGNED_OUT') { __cloudSession = null; }
    });
  } catch (e) { /* ignore */ }

  var got = null;
  try { got = await sb.auth.getSession(); } catch (e) { console.warn('getSession', e); }
  var session = got && got.data ? got.data.session : null;

  if (!session) {
    showCloudSignInGate();
    return false;
  }

  __cloudSession = session;
  setCloudGateBusy(true, 'Loading your program…');
  var ok = await loadOrCreateCloudProgram();
  if (ok) {
    hideCloudSignInGate();
    if (typeof bootAfterStateReady === 'function') bootAfterStateReady();
  }
  setCloudGateBusy(false);
  return ok;
}

// ── exports ──────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.isCloudConfigured = isCloudConfigured;
  window.isCloudEnabled = isCloudEnabled;
  window.isCloudSessionActive = isCloudSessionActive;
  window.isCloudLocked = isCloudLocked;
  window.signInWithMicrosoft = signInWithMicrosoft;   // overrides the legacy Entra one
  window.signInWithGoogle = signInWithGoogle;
  window.sendMagicLink = sendMagicLink;
  window.signOutCloud = signOutCloud;
  window.showCloudAccountMenu = showCloudAccountMenu;
  window.cloudPushDebounced = cloudPushDebounced;
  window.cloudPushNow = cloudPushNow;
  window.initCloudAuth = initCloudAuth;
}
