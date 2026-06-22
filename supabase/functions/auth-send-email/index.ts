// Supabase Auth Send Email Hook — optional branded mail via SendGrid.
// Default app path uses Supabase built-in mail (hook disabled) — no domain required.

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { escapeHtml, formatOrgPossessive, sendTransactionalEmail } from '../_shared/mail.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
};

function buildConfirmationUrl(emailData: { token_hash: string; email_action_type: string; redirect_to: string }) {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '');
  const params = new URLSearchParams({
    token: emailData.token_hash,
    type: emailData.email_action_type,
    redirect_to: emailData.redirect_to,
  });
  return `${supabaseUrl}/auth/v1/verify?${params.toString()}`;
}

function webhookHeaders(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  req.headers.forEach((value, key) => { out[key.toLowerCase()] = value; });
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: corsHeaders });

  const hookSecretRaw = Deno.env.get('SEND_EMAIL_HOOK_SECRET') || '';
  if (!hookSecretRaw) {
    return new Response(JSON.stringify({ error: 'Hook secret not configured' }), { status: 503, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const wh = new Webhook(hookSecretRaw.replace(/^v1,whsec_/, ''));
    const { user, email_data } = wh.verify(payload, webhookHeaders(req)) as {
      user: { email: string; user_metadata?: Record<string, unknown> };
      email_data: { token_hash: string; redirect_to: string; email_action_type: string };
    };

    const meta = user.user_metadata || {};
    const isIspInvite = !!meta.isp_approver_invite;
    const action = email_data.email_action_type;
    const confirmUrl = buildConfirmationUrl(email_data);

    let subject: string;
    let text: string;
    let html: string;

    if (isIspInvite && (action === 'signup' || action === 'magiclink')) {
      const owner = String(meta.invited_by || 'Your program owner').trim();
      const orgPoss = formatOrgPossessive(String(meta.org_name || ''));
      subject = `Approve ${orgPoss} Info Sec Policy`;
      text = `${owner} requested you to approve. Sign up to review.\n\n${confirmUrl}\n\nUse this email when you sign in: ${user.email}`;
      html =
        `<div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5;">`
        + `<p>${escapeHtml(owner)} requested you to approve. Sign up to review.</p>`
        + `<p><a href="${escapeHtml(confirmUrl)}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">Sign up to review</a></p>`
        + `<p style="font-size:13px;color:#64748b;">Use this email: <strong>${escapeHtml(user.email)}</strong></p></div>`;
    } else {
      subject = action === 'signup' ? 'Sign up to review a policy — EightFiftyThree GRC' : 'Sign in to EightFiftyThree GRC';
      text = `${subject}\n\n${confirmUrl}`;
      html = `<p><a href="${escapeHtml(confirmUrl)}">Continue</a></p>`;
    }

    const sent = await sendTransactionalEmail({ to: user.email, subject, text, html });
    if (!sent.ok) {
      console.error('auth-send-email', sent.error);
      return new Response(JSON.stringify({ error: sent.error }), { status: 502, headers: corsHeaders });
    }

    return new Response(JSON.stringify({}), { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error('auth-send-email', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
