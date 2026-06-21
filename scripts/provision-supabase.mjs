// scripts/provision-supabase.mjs
// One-shot Supabase provisioning, run from a GitHub Actions runner (which has
// open internet, unlike the Claude sandbox). Creates the project, applies
// supabase/schema.sql, configures the magic-link redirect URL, and prints the
// public Project URL + anon key so cloud-config.js can be wired up.
//
// Requires env:
//   SUPABASE_ACCESS_TOKEN  (required) personal access token, sbp_...
//   SUPABASE_ORG_ID        (optional) defaults to the first org on the account
//   SUPABASE_PROJECT_NAME  (optional) defaults to "eightfiftythree-grc"
//   SUPABASE_REGION        (optional) defaults to "us-east-1"
//   APP_URL                (optional) magic-link redirect target
//
// Secrets are never printed. The anon key is public by design, so it is.

import fs from 'node:fs';
import crypto from 'node:crypto';

const API = 'https://api.supabase.com';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const ORG_OVERRIDE = process.env.SUPABASE_ORG_ID || '';
const PROJECT_NAME = process.env.SUPABASE_PROJECT_NAME || 'eightfiftythree-grc';
const REGION = process.env.SUPABASE_REGION || 'us-east-1';
const APP_URL = process.env.APP_URL || 'https://eightfiftythreegrc.github.io/eightfiftythree-grc/app.html';

if (!TOKEN || !TOKEN.startsWith('sbp_')) {
  console.error('ERROR: SUPABASE_ACCESS_TOKEN is missing or not an sbp_ token.');
  process.exit(1);
}

function authHeaders(extra) {
  return Object.assign({ Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }, extra || {});
}

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: authHeaders(body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) { /* non-JSON */ }
  if (!res.ok) {
    throw new Error(method + ' ' + path + ' -> ' + res.status + ' ' + (text || '').slice(0, 400));
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // 1) Organization
  let orgId = ORG_OVERRIDE;
  if (!orgId) {
    const orgs = await api('GET', '/v1/organizations');
    if (!Array.isArray(orgs) || orgs.length === 0) {
      throw new Error('No organizations on this account. Create one in the Supabase dashboard first.');
    }
    orgId = orgs[0].id;
    console.log('Using organization:', orgs[0].name, '(' + orgId + ')');
  }

  // 2) Reuse an existing project of the same name if present (idempotent re-runs)
  const projects = await api('GET', '/v1/projects');
  let project = (Array.isArray(projects) ? projects : []).find((p) => p.name === PROJECT_NAME);

  if (project) {
    console.log('Found existing project "' + PROJECT_NAME + '" (' + project.id + ') — reusing.');
  } else {
    const dbPass = crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) + 'A1!';
    console.log('Creating project "' + PROJECT_NAME + '" in', REGION, '…');
    project = await api('POST', '/v1/projects', {
      name: PROJECT_NAME,
      organization_id: orgId,
      region: REGION,
      db_pass: dbPass
    });
    console.log('Project created:', project.id);
  }

  const ref = project.id || project.ref;
  if (!ref) throw new Error('Could not determine project ref from response: ' + JSON.stringify(project));

  // 3) Wait until the project (and its database) is healthy
  console.log('Waiting for the project to become healthy (can take a couple of minutes)…');
  let healthy = false;
  for (let i = 0; i < 60; i++) {
    let status = '';
    try {
      const p = await api('GET', '/v1/projects/' + ref);
      status = (p && (p.status || p.database?.status)) || '';
    } catch (e) {
      status = 'PENDING';
    }
    if (status === 'ACTIVE_HEALTHY') { healthy = true; break; }
    if (i % 5 === 0) console.log('  status:', status || 'unknown');
    await sleep(5000);
  }
  if (!healthy) console.log('  (proceeding even though status is not yet ACTIVE_HEALTHY)');

  // 4) Apply the schema. Retry briefly in case the DB endpoint isn't up yet.
  const schema = fs.readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
  console.log('Applying supabase/schema.sql …');
  let applied = false, lastErr = null;
  for (let i = 0; i < 12; i++) {
    try {
      await api('POST', '/v1/projects/' + ref + '/database/query', { query: schema });
      applied = true; break;
    } catch (e) {
      lastErr = e;
      await sleep(5000);
    }
  }
  if (!applied) throw new Error('Schema apply failed: ' + (lastErr && lastErr.message));
  console.log('Schema applied.');

  // 5) Configure auth: site URL + redirect allow-list for magic links
  console.log('Configuring magic-link redirect URLs …');
  try {
    await api('PATCH', '/v1/projects/' + ref + '/config/auth', {
      site_url: APP_URL,
      uri_allow_list: [APP_URL, APP_URL.replace(/\/app\.html$/, '/*'), APP_URL.replace(/\/[^/]*$/, '/*')].join(',')
    });
    console.log('Auth redirect URLs set.');
  } catch (e) {
    console.log('WARN: could not set auth config automatically (' + e.message + '). Set Site URL manually if magic links misredirect.');
  }

  // 6) Fetch the public anon key
  const keys = await api('GET', '/v1/projects/' + ref + '/api-keys');
  const keyList = Array.isArray(keys) ? keys : [];
  // Diagnostics (prefixes only — safe, not masked) to confirm the key format.
  console.log('API key entries:', keyList.map((k) => k.name + '(' + String(k.api_key || '').slice(0, 6) + '…,' + String(k.api_key || '').length + ')').join(', '));
  const anon = keyList.find((k) => k.name === 'anon');
  if (!anon || !anon.api_key) throw new Error('Could not find the anon API key.');

  const url = 'https://' + ref + '.supabase.co';

  // Write cloud-config.js directly (log masking does NOT affect file contents).
  const configPath = new URL('../js/cloud-config.js', import.meta.url);
  const config = `// js/cloud-config.js — Supabase connection settings for multi-user (cloud) mode.
// Generated by scripts/provision-supabase.mjs. The anon key is a PUBLIC client
// key; all access is enforced by Row-Level Security (supabase/schema.sql).
// Never put the service_role key here.
var CLOUD_CONFIG = {
  supabaseUrl: ${JSON.stringify(url)},
  supabaseAnonKey: ${JSON.stringify(anon.api_key)},
  appUrl: ${JSON.stringify(APP_URL)},
  enableMagicLink: false,
  enableEmailPassword: true,
  enableGoogle: false,
  enableMicrosoft: false
};
`;
  fs.writeFileSync(configPath, config, 'utf8');
  console.log('Wrote js/cloud-config.js');

  console.log('\n================ PROVISION RESULT ================');
  console.log('PROVISION_URL=' + url);
  console.log('PROVISION_ANON_PREFIX=' + String(anon.api_key).slice(0, 8) + ' (len ' + String(anon.api_key).length + ')');
  console.log('=================================================');
  console.log('Done. cloud-config.js written; the anon key is public (safe to commit).');
}

main().catch((e) => {
  console.error('PROVISION FAILED:', e.message);
  process.exit(1);
});
