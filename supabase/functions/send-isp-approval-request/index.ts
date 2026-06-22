// ISP approver invite — branded copy + magic link (SendGrid).
// Optional: default path uses Supabase built-in mail with hook disabled.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { escapeHtml, formatOrgPossessive, sendTransactionalEmail } from '../_shared/mail.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const approverEmail = String(body.approverEmail || '').trim().toLowerCase();
    const programOwnerName = String(body.programOwnerName || '').trim();
    const orgName = String(body.orgName || '').trim();
    const appUrl = String(body.appUrl || '').trim() || 'https://eightfiftythreegrc.github.io/eightfiftythree-grc/app.html';

    if (!approverEmail || !approverEmail.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid approver email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Service role not available' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: approverEmail,
      options: { redirectTo: appUrl, data: { isp_approver_invite: true, invited_by: programOwnerName, org_name: orgName } },
    });

    const magicLink = linkData?.properties?.action_link;
    if (linkError || !magicLink) {
      return new Response(JSON.stringify({ error: 'Could not generate sign-in link', detail: linkError?.message }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const owner = programOwnerName || 'Your program owner';
    const orgPoss = formatOrgPossessive(orgName);
    const subject = `Approve ${orgPoss} Info Sec Policy`;
    const text = `${owner} requested you to approve. Sign up to review.\n\n${magicLink}\n\nUse this email when you sign in: ${approverEmail}`;
    const html =
      `<div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5;">`
      + `<p>${escapeHtml(owner)} requested you to approve. Sign up to review.</p>`
      + `<p><a href="${escapeHtml(magicLink)}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">Sign up to review</a></p>`
      + `<p style="font-size:13px;color:#64748b;">Use this email: <strong>${escapeHtml(approverEmail)}</strong></p></div>`;

    const sent = await sendTransactionalEmail({ to: approverEmail, subject, text, html });
    if (!sent.ok) {
      return new Response(JSON.stringify({ error: sent.error }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, provider: sent.provider }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
