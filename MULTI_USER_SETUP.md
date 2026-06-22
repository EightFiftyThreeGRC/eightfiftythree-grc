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

### 5. ISP approver emails (invite a real person to sign up and approve)

When a CISO routes the ISP to a **different approver** while signed in, the app emails them a
**magic sign-in link** to `app.html`. They create an account with that same address and land as
the **approver** from your roster.

**Default (after deploy):** Supabase sends the email — works for **any** approver address
(e.g. `nistcsftool@gmail.com`). Subject/body are Supabase’s standard confirmation template.

**Optional branded mail** (`Approve [Org]'s Info Sec Policy` / `[CISO] requested you to approve…`):

1. Verify your domain in [Resend](https://resend.com)
2. Set GitHub repo **Variable** `EMAIL_FROM` = `EightFiftyThree GRC <noreply@yourdomain.com>`
3. Re-run **Deploy Supabase email functions** with `ENABLE_BRANDED_AUTH_HOOK=true` in workflow env,
   or locally:  
   `EMAIL_FROM="..." ENABLE_BRANDED_AUTH_HOOK=true RESEND_API_KEY=... SUPABASE_ACCESS_TOKEN=... node scripts/configure-supabase-email.mjs`

If approver email fails after a branded deploy, **disable** the Send Email hook so real invites
work again: Supabase Dashboard → **Authentication** → **Hooks** → **Send Email** → off.
Then re-run the deploy workflow (it now disables the hook by default unless `EMAIL_FROM` is set).

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
