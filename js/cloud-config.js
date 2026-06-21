// js/cloud-config.js — Supabase connection settings for multi-user (cloud) mode.
// ----------------------------------------------------------------------------
// SAFE TO COMMIT. The anon key is a *public* client key; it grants nothing on
// its own — every read/write is enforced server-side by Row-Level Security
// (see supabase/schema.sql). Never put the service_role key here.
//
// Leave BOTH fields blank to keep the app in single-user local/demo mode
// (data stays in this browser's localStorage, exactly as before). Fill them in
// to turn on real sign-in + cross-computer sync.
//
// Where to find these: Supabase dashboard → Project Settings → API.
//   • supabaseUrl    = "Project URL"     e.g. https://abcd1234.supabase.co
//   • supabaseAnonKey = "anon public" key (starts with "eyJ...")
//
// See MULTI_USER_SETUP.md for the full one-time setup (schema + OAuth providers).
// ----------------------------------------------------------------------------
var CLOUD_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: ''
};
