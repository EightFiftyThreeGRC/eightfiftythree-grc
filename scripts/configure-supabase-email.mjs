// scripts/configure-supabase-email.mjs
// Deploys ISP email edge functions and enables the Auth Send Email hook.
//
// Requires env:
//   SUPABASE_ACCESS_TOKEN  (sbp_...)
//   RESEND_API_KEY
// Optional:
//   SUPABASE_PROJECT_REF   (default: parsed from js/cloud-config.js)
//   EMAIL_FROM
//   SEND_EMAIL_HOOK_SECRET (auto-generated if omitted)

import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const API = 'https://api.supabase.com';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const RESEND = process.env.RESEND_API_KEY;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (!TOKEN || !TOKEN.startsWith('sbp_')) {
  console.error('ERROR: SUPABASE_ACCESS_TOKEN (sbp_...) is required.');
  process.exit(1);
}
if (!RESEND) {
  console.error('ERROR: RESEND_API_KEY is required.');
  process.exit(1);
}

function authHeaders(extra) {
  return Object.assign({ Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }, extra || {});
}

async function api(method, apiPath, body) {
  const res = await fetch(API + apiPath, {
    method,
    headers: authHeaders(body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) { /* */ }
  if (!res.ok) {
    throw new Error(method + ' ' + apiPath + ' -> ' + res.status + ' ' + (text || '').slice(0, 400));
  }
  return json;
}

function readProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF.trim();
  const cfg = fs.readFileSync(path.join(ROOT, 'js/cloud-config.js'), 'utf8');
  const m = cfg.match(/supabaseUrl:\s*"https:\/\/([^.]+)\.supabase\.co"/);
  if (!m) throw new Error('Could not parse project ref from js/cloud-config.js');
  return m[1];
}

function generateHookSecret() {
  const b64 = crypto.randomBytes(24).toString('base64');
  return 'v1,whsec_' + b64;
}

function run(cmd, args, env) {
  console.log('>', cmd, args.join(' '));
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    env: Object.assign({}, process.env, env),
    stdio: 'inherit',
    shell: false,
  });
  if (r.status !== 0) {
    throw new Error(cmd + ' exited ' + r.status);
  }
}

async function main() {
  const ref = readProjectRef();
  let hookSecret = process.env.SEND_EMAIL_HOOK_SECRET || '';
  if (!hookSecret) {
    try {
      const authCfg = await api('GET', '/v1/projects/' + ref + '/config/auth');
      if (authCfg && authCfg.hook_send_email_secrets) {
        hookSecret = String(authCfg.hook_send_email_secrets);
        console.log('Reusing existing Send Email hook secret from project config.');
      }
    } catch (e) {
      console.log('Could not read auth config (will generate new hook secret):', e.message);
    }
  }
  if (!hookSecret) hookSecret = generateHookSecret();
  const emailFrom = process.env.EMAIL_FROM || 'EightFiftyThree GRC <onboarding@resend.dev>';
  const useBrandedHook = process.env.ENABLE_BRANDED_AUTH_HOOK === 'true'
    || (process.env.EMAIL_FROM && emailFrom.indexOf('resend.dev') < 0);

  console.log('Project ref:', ref);

  // Link + deploy via Supabase CLI (installed via npx in CI).
  run('npx', ['--yes', 'supabase@2', 'link', '--project-ref', ref], {
    SUPABASE_ACCESS_TOKEN: TOKEN,
  });

  const secrets = [
    'RESEND_API_KEY=' + RESEND,
    'SEND_EMAIL_HOOK_SECRET=' + hookSecret,
    'EMAIL_FROM=' + emailFrom,
  ].join('\n');
  const secretsFile = path.join(ROOT, '.supabase-email-secrets.tmp');
  fs.writeFileSync(secretsFile, secrets, 'utf8');
  try {
    run('npx', ['--yes', 'supabase@2', 'secrets', 'set', '--env-file', secretsFile], {
      SUPABASE_ACCESS_TOKEN: TOKEN,
    });
  } finally {
    try { fs.unlinkSync(secretsFile); } catch (_) { /* */ }
  }

  run('npx', ['--yes', 'supabase@2', 'functions', 'deploy', 'auth-send-email', '--no-verify-jwt'], {
    SUPABASE_ACCESS_TOKEN: TOKEN,
  });
  run('npx', ['--yes', 'supabase@2', 'functions', 'deploy', 'send-isp-approval-request'], {
    SUPABASE_ACCESS_TOKEN: TOKEN,
  });

  const hookUrl = `https://${ref}.supabase.co/functions/v1/auth-send-email`;
  console.log('Enabling Send Email hook →', hookUrl);
  await api('PATCH', '/v1/projects/' + ref + '/config/auth', {
    hook_send_email_enabled: true,
    hook_send_email_uri: hookUrl,
    hook_send_email_secrets: hookSecret,
  });

  console.log('\nDone. ISP approver emails will use subject: "Approve [org]\'s Info Sec Policy"');
  console.log('Hook secret was', process.env.SEND_EMAIL_HOOK_SECRET ? 'from env' : 'auto-generated and saved to the project.');
}

main().catch((e) => {
  console.error('CONFIGURE FAILED:', e.message);
  process.exit(1);
});
