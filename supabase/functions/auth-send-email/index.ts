// Supabase Auth Send Email Hook — branded ISP approver invites + default auth emails.
// Deploy with --no-verify-jwt. Requires RESEND_API_KEY and SEND_EMAIL_HOOK_SECRET.
// Enable: Dashboard → Auth → Hooks → Send Email, or scripts/configure-supabase-email.mjs

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
};

function escapeHtml(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatOrgPossessive(org: string): string {
  const name = String(org || '').trim();
  if (!name) return "your organization's";
  if (/['']s$/i.test(name)) return name;
  if (name.endsWith('s')) return `${name}'`;
  return `${name}'s`;
}

function buildConfirmationUrl(emailData: { token_hash: string; email_action_type: string; redirect_to: string }) {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '');
  const params = new URLSearchParams({
    token: emailData.token_hash,
    type: emailData.email_action_type,
    redirect_to: emailData.redirect_to,
  });
  return `${supabaseUrl}/auth/v1/verify?${params.toString()}`;
}

const DEFAULT_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email address',
  magiclink: 'Your sign-in link',
  recovery: 'Reset your password',
  invite: "You've been invited",
  email_change: 'Confirm your new email address',
  email_change_new: 'Confirm your new email address',
};

const DEFAULT_HTML: Record<string, string> = {
  signup: '<h2>Confirm your email address</h2><p><a href="{{url}}">Confirm email address</a></p>',
  magiclink: '<h2>Your sign-in link</h2><p><a href="{{url}}">Sign in</a></p>',
  recovery: '<h2>Reset your password</h2><p><a href="{{url}}">Reset password</a></p>',
  invite: '<h2>You\'ve been invited</h2><p><a href="{{url}}">Accept invitation</a></p>',
  email_change: '<h2>Confirm your new email address</h2><p><a href="{{url}}">Confirm</a></p>',
  email_change_new: '<h2>Confirm your new email address</h2><p><a href="{{url}}">Confirm</a></p>',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: corsHeaders });
  }

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const hookSecretRaw = Deno.env.get('SEND_EMAIL_HOOK_SECRET') || '';
  if (!resendKey || !hookSecretRaw) {
    return new Response(JSON.stringify({ error: 'Email hook not configured' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const hookSecret = hookSecretRaw.replace(/^v1,whsec_/, '');
    const wh = new Webhook(hookSecret);
    const { user, email_data } = wh.verify(payload, headers) as {
      user: {
        email: string;
        user_metadata?: Record<string, unknown>;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    const meta = user.user_metadata || {};
    const isIspInvite = !!meta.isp_approver_invite;
    const action = email_data.email_action_type;
    const confirmUrl = buildConfirmationUrl(email_data);
    const from = Deno.env.get('EMAIL_FROM') || 'EightFiftyThree GRC <onboarding@resend.dev>';

    let subject: string;
    let text: string;
    let html: string;

    if (isIspInvite && (action === 'signup' || action === 'magiclink')) {
      const owner = String(meta.invited_by || 'Your program owner').trim();
      const orgPoss = formatOrgPossessive(String(meta.org_name || ''));
      subject = `Approve ${orgPoss} Info Sec Policy`;
      text =
        `${owner} requested you to approve. Sign up to review.\n\n`
        + `${confirmUrl}\n\n`
        + `Use this email when you sign in: ${user.email}`;
      html =
        `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;color:#0f172a;line-height:1.5;">`
        + `<p style="font-size:15px;margin:0 0 16px;">${escapeHtml(owner)} requested you to approve. Sign up to review.</p>`
        + `<p style="margin:0 0 20px;"><a href="${escapeHtml(confirmUrl)}" `
        + `style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:700;`
        + `padding:12px 20px;border-radius:8px;">Sign up to review</a></p>`
        + `<p style="font-size:13px;color:#64748b;margin:0;">Use this email when you sign in: `
        + `<strong>${escapeHtml(user.email)}</strong></p>`
        + `</div>`;
    } else {
      subject = DEFAULT_SUBJECTS[action] || 'EightFiftyThree GRC';
      const tpl = DEFAULT_HTML[action] || '<p><a href="{{url}}">Continue</a></p>';
      html = tpl.replace(/\{\{url\}\}/g, escapeHtml(confirmUrl));
      text = `${subject}\n\n${confirmUrl}`;
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + resendKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [user.email],
        subject,
        text,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      throw new Error('Resend failed: ' + errText.slice(0, 200));
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('auth-send-email', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
