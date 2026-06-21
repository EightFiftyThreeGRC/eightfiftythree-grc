// Supabase Edge Function — notify ISP approver to sign up and review the policy.
// Deploy: supabase functions deploy send-isp-approval-request
// Secrets: RESEND_API_KEY (required), EMAIL_FROM (optional, e.g. "EightFiftyThree GRC <noreply@yourdomain.com>")

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const approverEmail = String(body.approverEmail || '').trim().toLowerCase();
    const programOwnerName = String(body.programOwnerName || '').trim();
    const orgName = String(body.orgName || '').trim();
    const appUrl = String(body.appUrl || '').trim();

    if (!approverEmail || !approverEmail.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid approver email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Email not configured (RESEND_API_KEY missing)' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const owner = programOwnerName || 'Your program owner';
    const org = orgName || 'your organization';
    const link = appUrl || 'https://eightfiftythreegrc.github.io/eightfiftythree-grc/app.html';
    const subject = owner + ' asked you to approve the ISP for ' + org;
    const text =
      owner + ' has asked you to approve the Information Security Policy for ' + org + '.\n\n'
      + 'Sign up to approve the policy:\n' + link + '\n\n'
      + 'Use this email address when you create your account: ' + approverEmail;
    const html =
      '<p>' + escapeHtml(owner) + ' has asked you to approve the Information Security Policy for '
      + '<strong>' + escapeHtml(org) + '</strong>.</p>'
      + '<p><a href="' + escapeHtml(link) + '">Sign up to approve the policy</a></p>'
      + '<p>Use this email address when you create your account: <strong>' + escapeHtml(approverEmail) + '</strong></p>';

    const from = Deno.env.get('EMAIL_FROM') || 'EightFiftyThree GRC <onboarding@resend.dev>';
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + resendKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [approverEmail],
        subject,
        text,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      return new Response(JSON.stringify({ error: 'Email send failed', detail: errText.slice(0, 300) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
