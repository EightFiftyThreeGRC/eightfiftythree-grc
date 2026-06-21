// js/cloud-config.js — Supabase connection settings for multi-user (cloud) mode.
// ----------------------------------------------------------------------------
// SAFE TO COMMIT. The anon key is a *public* client key; it grants nothing on
// its own — every read/write is enforced server-side by Row-Level Security
// (see supabase/schema.sql). Never put the service_role key here.
//
// Leave supabaseUrl / supabaseAnonKey blank to keep the app in single-user
// local/demo mode (data stays in this browser). Fill them in to turn on real
// sign-in + cross-computer sync.
//
// Where to find these: Supabase dashboard → Project Settings → API.
//   • supabaseUrl     = "Project URL"     e.g. https://abcd1234.supabase.co
//   • supabaseAnonKey = "anon public" key (starts with "eyJ...")
//
// Sign-in methods (turn on whichever you've configured in Supabase):
//   • enableMagicLink  — passwordless email link. Works with ZERO extra setup
//                        (Supabase email auth is on by default). Recommended.
//   • enableGoogle     — requires a Google OAuth app + the Google provider
//                        enabled in Supabase.
//   • enableMicrosoft  — requires an Entra app + the Azure provider enabled.
//
// See MULTI_USER_SETUP.md for full setup.
// ----------------------------------------------------------------------------
var CLOUD_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  enableMagicLink: true,
  enableGoogle: false,
  enableMicrosoft: false
};
