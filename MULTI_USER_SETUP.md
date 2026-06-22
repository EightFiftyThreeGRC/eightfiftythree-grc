# Multi-User Setup (Cloud Mode)

EightFiftyThree GRC runs in two modes:

- **Local / demo mode (default):** zero-config, all data in the browser's
  `localStorage`, profile picking for demos. This is what the public GitHub
  Pages demo uses — nothing changes if you skip this guide.
- **Cloud / multi-user mode:** real "Sign in with Microsoft / Google", one
  shared program that syncs across computers, and roles tied to each person's
  authenticated identity (no impersonation).

Cloud mode is powered by [Supabase](https://supabase.com) (managed Postgres +
Auth). The front-end stays exactly where it is — GitHub Pages, no build step.

---

## What you get

| | Local mode | Cloud mode |
|---|---|---|
| Sign-in | Pick a demo profile | Microsoft / Google OAuth |
| Data location | This browser only | Shared Postgres, all computers |
| Roles | Anyone can switch (impersonation) | Locked to your real identity |
| Cost | Free | Free tier is generous |

---

## One-time setup (~15 minutes)

### 1. Create a Supabase project
1. Go to <https://supabase.com> → **New project**. Pick a name and a strong
   database password (you won't need it again for this).
2. Wait for it to finish provisioning.

### 2. Create the database table + security rules
1. In the project, open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql)
   and click **Run**. This creates the `programs` table and the Row-Level
   Security policies that enforce access by email.

### 3. Enable the sign-in providers
In **Authentication → Providers**:

- **Google** — toggle on, paste a Google OAuth **Client ID** and **Client
  secret** (create them at
  <https://console.cloud.google.com/apis/credentials> → OAuth client →
  *Web application*). In the Google console, add Supabase's callback URL
  (shown on the Supabase Google provider page, looks like
  `https://<your-project>.supabase.co/auth/v1/callback`) under
  **Authorized redirect URIs**.
- **Azure (Microsoft)** — toggle on, paste an Entra app registration's
  **Application (client) ID** and a **client secret**. In the Entra portal,
  add the same Supabase callback URL as a **Web** redirect URI, and set the
  account types to whatever you want to allow (e.g. "Accounts in any
  organizational directory").

Then in **Authentication → URL Configuration**, add your app's URL (e.g.
`https://eightfiftythreegrc.github.io/eightfiftythree-grc/app.html`) to
**Redirect URLs**, plus `http://localhost:...` if you test locally.

### 4. Point the app at your project
Open [`js/cloud-config.js`](js/cloud-config.js) and fill in the two public
values from **Project Settings → API**:

```js
var CLOUD_CONFIG = {
  supabaseUrl: 'https://YOURPROJECT.supabase.co',
  supabaseAnonKey: 'eyJhbGci...'   // the "anon public" key
};
```

These are **safe to commit** — the anon key is a public client key and grants
nothing on its own; all access is enforced by the RLS policies from step 2.
**Never** put the `service_role` key here.

Commit, push, and GitHub Pages redeploys. Done.

### 5. ISP approver emails (Resend — production setup)

When a CISO picks **Different approver** and advances past ISP Step 3, the app emails that
person a **sign-in link** to create an account and approve the Tier-1 ISP. For **any real email
address** (not just your own), you must send through **Resend using a domain you control**.
The default `onboarding@resend.dev` sender cannot deliver to arbitrary approvers.

#### What you are setting up

| Piece | Purpose |
|--------|---------|
| [Resend](https://resend.com) | Sends the email (any recipient, once domain is verified) |
| Verified domain in Resend | Proves you may send as `noreply@yourdomain.com` |
| `RESEND_API_KEY` (GitHub secret) | Edge functions call Resend API |
| `EMAIL_FROM` (GitHub variable) | From line, must use your verified domain |
| Supabase edge functions | `auth-send-email` hook + `send-isp-approval-request` |
| Send Email auth hook | Intercepts magic-link mail and applies branded copy |

Branded message:

- **Subject:** `Approve [Your Org]'s Info Sec Policy`
- **Body:** `[CISO name] requested you to approve. Sign up to review.` + button link

---

#### Step 1 — Domain you control

You need a domain whose DNS you can edit (e.g. `yourcompany.com`, or a subdomain like
`mail.yourcompany.com`). You **cannot** use `github.io` for Resend verification.

In Resend: **Domains** → **Add Domain** → enter the domain → Resend shows DNS records (SPF,
DKIM, optional DMARC).

Add those records at your DNS host (Cloudflare, Route53, Google Domains, etc.). Wait until
Resend shows the domain as **Verified** (often 5–30 minutes, sometimes longer).

---

#### Step 2 — Resend API key

1. Resend → **API Keys** → **Create API Key**
2. Name: `eightfiftythree-grc-production`
3. Permission: **Sending access** (or Full access)
4. Copy the key (`re_...`) — shown once

---

#### Step 3 — GitHub repo configuration

Open **https://github.com/EightFiftyThreeGRC/eightfiftythree-grc** → **Settings** →
**Secrets and variables** → **Actions**

**Secrets** (encrypted):

| Name | Value |
|------|--------|
| `SUPABASE_ACCESS_TOKEN` | Supabase personal token from [Account → Tokens](https://supabase.com/dashboard/account/tokens) (`sbp_...`) |
| `RESEND_API_KEY` | `re_...` from Step 2 |

**Variables** (not secret):

| Name | Example value |
|------|----------------|
| `EMAIL_FROM` | `EightFiftyThree GRC <noreply@yourdomain.com>` |

The address after `@` must match your **verified** Resend domain. Display name before `<` is optional.

Optional: `ENABLE_BRANDED_AUTH_HOOK` = `true` forces the branded hook even if you need to
override auto-detection (normally setting `EMAIL_FROM` on a non-`resend.dev` domain is enough).

---

#### Step 4 — Supabase redirect URL (one-time)

Supabase project **mdysqwcbgfizzojqojwu** (or yours) → **Authentication** → **URL configuration**

Ensure **Redirect URLs** includes:

```text
https://eightfiftythreegrc.github.io/eightfiftythree-grc/app.html
```

Add a wildcard if you use preview URLs:

```text
https://eightfiftythreegrc.github.io/eightfiftythree-grc/**
```

**Site URL** can be the same `app.html` URL.

Without this, magic links in the email may not return users to the app.

---

#### Step 5 — Deploy edge functions + enable branded hook

1. GitHub → **Actions** → **Deploy Supabase email functions**
2. **Run workflow** → branch `main` → **Run workflow**
3. Wait for green checkmark

The script will:

- Deploy `auth-send-email` and `send-isp-approval-request`
- Store `RESEND_API_KEY`, `EMAIL_FROM`, and hook secret in Supabase
- **Enable** the Send Email hook when `EMAIL_FROM` uses your verified domain

**Or locally:**

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
export RESEND_API_KEY=re_...
export EMAIL_FROM='EightFiftyThree GRC <noreply@yourdomain.com>'
node scripts/configure-supabase-email.mjs
```

---

#### Step 6 — Verify in dashboards

**Resend → Logs** — after a test send you should see `delivered` (not `validation_error`).

**Supabase → Authentication → Hooks** — **Send Email** should be **Enabled**, URL ending in
`/functions/v1/auth-send-email`.

**Supabase → Edge Functions** — `auth-send-email` and `send-isp-approval-request` listed.

---

#### Step 7 — Test the product flow

1. Hard-refresh `app.html`, **signed in** (cloud mode)
2. Program setup → ISP Step 3 → check **Different approver**
3. Enter approver **name** and **real email** (e.g. `nistcsftool@gmail.com`)
4. Click **Next** past Step 3
5. Toast should say approval / sign-in email was sent
6. Approver inbox: subject `Approve … Info Sec Policy`, body with sign-up link
7. Approver clicks link → lands on app → signs up with **that same email** → gets approver role

If ISP was already “Under Review” from earlier attempts, going back to Step 3 and clicking
**Next** again will resend the invite.

---

#### Troubleshooting

| Symptom | Fix |
|---------|-----|
| Resend log: “only send testing emails…” | Domain not verified or `EMAIL_FROM` still uses `resend.dev` |
| Edge function / hook 500 | Re-run deploy; check Supabase → Edge Functions → Logs |
| Email never arrives | Resend Logs + spam; confirm domain verified |
| Link opens app but sign-in fails | Add `app.html` to Supabase redirect URLs (Step 4) |
| Generic Supabase “Confirm your email” | Send Email hook disabled — re-run deploy with `EMAIL_FROM` set |
| Toast still shows errors | Hard-refresh app; browser console for `sendISPApprovalRequestEmail` |

---

#### How the code sends mail (reference)

1. App calls `signInWithOtp` for the approver email (with org/CISO in user metadata).
2. Supabase invokes the **Send Email** hook → `auth-send-email` → Resend with branded template.
3. If that path fails, the app tries `send-isp-approval-request` (same copy, admin-generated magic link).

Both paths require a working `RESEND_API_KEY` and verified `EMAIL_FROM`.

---

## How it works

- The whole client `state` object is stored as a single JSONB row in
  `programs`. The existing `saveToStorage()` still writes a local cache, and in
  cloud mode also pushes to Supabase (debounced ~1s). Realtime keeps other
  signed-in users in sync.
- **Access is by email.** A person can open a program if they are the program
  **owner** or their email is on that program's roster (**Users & roles**).
  RLS enforces this server-side.
- **Roles come from the roster.** When you sign in, your email is matched to a
  roster entry and you get that person's role and tabs. You cannot switch to
  anyone else — impersonation is disabled while signed in.

### First run
1. The first person to sign in has no program yet, so the app **creates one**
   and makes them the owner (full access).
2. The owner opens **Users & roles** and adds teammates **by their work email**
   with the right role.
3. Each teammate signs in with Microsoft/Google. Their email matches the roster,
   so they land in their own role's workspace on any computer.

> If someone signs in and isn't on any roster, they'll see a message asking
> their program owner to add their email. (They won't silently get a blank
> program.)

---

## Limitations (Phase 1) & what's next

- **Concurrency is last-write-wins.** Two people editing simultaneously can
  overwrite each other; realtime only auto-refreshes a browser that has no
  unsaved edits. For small teams editing different areas this is fine.
- **One JSON blob** means all of a program's data syncs together.

**Phase 2** (future): normalize the hot collections (controls, owners,
attestations, authorization boundaries) into their own tables with per-row RLS
and realtime, for true simultaneous editing. The single-blob schema here is
deliberately the smallest change that delivers real login + cross-computer sync.

---

## Turning it off
Blank out both fields in `js/cloud-config.js` and the app silently reverts to
local/demo mode. The legacy "Sign in with Microsoft" (Entra/MSAL) feature under
**Users & roles** is independent and unaffected.
