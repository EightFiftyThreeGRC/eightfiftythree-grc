// scripts/configure-supabase-email.mjs
// Configures ISP approver email for cloud mode.
//
// DEFAULT (no extra API keys): Supabase built-in auth mail → any approver address.
//   Disables Send Email hook, patches auth templates with policy-invite copy.
//
// OPTIONAL branded mail (no domain purchase): SendGrid + Single Sender Verification
//   on your Gmail/work email. Set SENDGRID_API_KEY + EMAIL_FROM in GitHub.
//
// Requires: SUPABASE_ACCESS_TOKEN (sbp_...)

import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const API = 'https://api.supabase.com';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SENDGRID = process.env.SENDGRID_API_KEY || '';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (!TOKEN || !TOKEN.startsWith('sbp_')) {
  console.error('ERROR: SUPABASE_ACCESS_TOKEN (sbp_...) is required.');
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
  return 'v1,whsec_' + crypto.randomBytes(24).toString('base64');
}

function run(cmd, args, env) {
  console.log('>', cmd, args.join(' '));
  const r = spawnSync(cmd, args, { cwd: ROOT, env: Object.assign({}, process.env, env), stdio: 'inherit', shell: false });
  if (r.status !== 0) throw new Error(cmd + ' exited ' + r.status);
}

const AUTH_TEMPLATE_PATCH = {
  mailer_subjects_confirmation: 'Sign up to review a policy — EightFiftyThree GRC',
  mailer_subjects_magic_link: 'Sign in to EightFiftyThree GRC',
  mailer_templates_confirmation_content:
    '<h2>Policy review invitation</h2>'
    + '<p>You have been invited to review an Information Security Policy for a GRC program.</p>'
    + '<p><a href="{{ .ConfirmationURL }}">Sign up to review</a></p>'
    + '<p>Use the <strong>same email address</strong> you were invited with.</p>',
  mailer_templates_magic_link_content:
    '<h2>Sign in to EightFiftyThree GRC</h2>'
    + '<p><a href="{{ .ConfirmationURL }}">Continue</a></p>',
};

async function main() {
  const ref = readProjectRef();
  const emailFrom = (process.env.EMAIL_FROM || process.env.SENDER_EMAIL || '').trim();
  const useBrandedHook = process.env.ENABLE_BRANDED_AUTH_HOOK === 'true' || (!!SENDGRID && !!emailFrom);

  console.log('Project ref:', ref);
  console.log('Mail mode:', useBrandedHook
    ? 'SendGrid branded hook'
    : 'Supabase built-in (default — any approver email)');

  if (useBrandedHook) {
    if (!SENDGRID || !emailFrom) {
      console.error('ERROR: Branded hook requires SENDGRID_API_KEY and EMAIL_FROM.');
      process.exit(1);
    }

    let hookSecret = process.env.SEND_EMAIL_HOOK_SECRET || '';
    if (!hookSecret) {
      try {
        const authCfg = await api('GET', '/v1/projects/' + ref + '/config/auth');
        if (authCfg && authCfg.hook_send_email_secrets) hookSecret = String(authCfg.hook_send_email_secrets);
      } catch (e) { /* */ }
    }
    if (!hookSecret) hookSecret = generateHookSecret();

    run('npx', ['--yes', 'supabase@2', 'link', '--project-ref', ref], { SUPABASE_ACCESS_TOKEN: TOKEN });

    const secretLines = [
      'SEND_EMAIL_HOOK_SECRET=' + hookSecret,
      'SENDGRID_API_KEY=' + SENDGRID,
      'EMAIL_FROM=' + emailFrom,
    ];

    const secretsFile = path.join(ROOT, '.supabase-email-secrets.tmp');
    fs.writeFileSync(secretsFile, secretLines.join('\n'), 'utf8');
    try {
      run('npx', ['--yes', 'supabase@2', 'secrets', 'set', '--env-file', secretsFile], { SUPABASE_ACCESS_TOKEN: TOKEN });
    } finally {
      try { fs.unlinkSync(secretsFile); } catch (_) { /* */ }
    }

    run('npx', ['--yes', 'supabase@2', 'functions', 'deploy', 'auth-send-email', '--no-verify-jwt'], { SUPABASE_ACCESS_TOKEN: TOKEN });
    run('npx', ['--yes', 'supabase@2', 'functions', 'deploy', 'send-isp-approval-request'], { SUPABASE_ACCESS_TOKEN: TOKEN });

    const hookUrl = `https://${ref}.supabase.co/functions/v1/auth-send-email`;
    await api('PATCH', '/v1/projects/' + ref + '/config/auth', Object.assign({}, AUTH_TEMPLATE_PATCH, {
      hook_send_email_enabled: true,
      hook_send_email_uri: hookUrl,
      hook_send_email_secrets: hookSecret,
    }));
    console.log('\nDone. Branded approver email enabled via SendGrid.');
  } else {
    await api('PATCH', '/v1/projects/' + ref + '/config/auth', Object.assign({}, AUTH_TEMPLATE_PATCH, {
      hook_send_email_enabled: false,
      hook_send_email_uri: '',
      hook_send_email_secrets: '',
    }));
    console.log('\nDone. Send Email hook OFF — approver invites use Supabase mail (works for any address).');
  }
}

main().catch((e) => {
  console.error('CONFIGURE FAILED:', e.message);
  process.exit(1);
});
