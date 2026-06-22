// Transactional email via SendGrid Single Sender Verification (verify Gmail — no domain purchase).

export function escapeHtml(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatOrgPossessive(org: string): string {
  const name = String(org || '').trim();
  if (!name) return "your organization's";
  if (/['']s$/i.test(name)) return name;
  if (name.endsWith('s')) return `${name}'`;
  return `${name}'s`;
}

function parseFromAddress(from: string): { email: string; name?: string } {
  const raw = String(from || '').trim();
  const m = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { email: raw };
}

export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ ok: true; provider: string } | { ok: false; error: string }> {
  const to = String(opts.to || '').trim().toLowerCase();
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY') || '';
  const fromRaw = Deno.env.get('EMAIL_FROM') || Deno.env.get('SENDER_EMAIL') || '';

  if (!sendgridKey) {
    return {
      ok: false,
      error: 'SENDGRID_API_KEY not configured — disable the Send Email hook to use Supabase built-in mail',
    };
  }

  if (!fromRaw) {
    return { ok: false, error: 'EMAIL_FROM or SENDER_EMAIL not configured on edge function' };
  }

  const from = parseFromAddress(fromRaw);
  if (!from.email) return { ok: false, error: 'Invalid EMAIL_FROM' };

  const body: Record<string, unknown> = {
    personalizations: [{ to: [{ email: to }] }],
    from: from.name ? { email: from.email, name: from.name } : { email: from.email },
    subject: opts.subject,
    content: [
      { type: 'text/plain', value: opts.text },
      { type: 'text/html', value: opts.html },
    ],
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + sendgridKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.ok || res.status === 202) return { ok: true, provider: 'sendgrid' };
  const errText = await res.text();
  return { ok: false, error: 'SendGrid: ' + errText.slice(0, 280) };
}
