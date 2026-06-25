# Multi-User Setup (Cloud Mode)

EightFiftyThree GRC requires cloud sign-in. There is no local-only or profile-picking demo mode — every session is tied to a real account, and program data syncs through Supabase.

Cloud mode is powered by [Supabase](https://supabase.com) (managed Postgres +
Auth). The front-end stays exactly where it is — GitHub Pages, no build step.

---

## What you get

| | Cloud mode |
|---|---|
| Sign-in | Email/password (and optional Microsoft / Google OAuth) |
| Data location | Shared Postgres, all computers |
| Roles | Locked to your rostered identity |
| Cost | Free tier is generous |

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

### 5. ISP approver email (no domain required)

When a CISO picks **Different approver** and advances past ISP Step 3, the app emails that person a **magic sign-in link** so they can create an account and approve the Tier-1 ISP.

**You do not need to buy a domain.** The default path uses **Supabase built-in auth mail**, which delivers to any real address (Gmail, work mail, etc.).

| Path | Setup | Branded subject? |
|------|--------|------------------|
| **Default — Supabase** | `SUPABASE_ACCESS_TOKEN` only | Generic (“Sign up to review…”) but works everywhere |
| **Optional — SendGrid** | Verify your existing Gmail (free single-sender) | Yes — “Approve [Org]'s Info Sec Policy” |

#### Step 1 — Supabase redirect URL (one-time)

**Authentication → URL configuration**

| Field | Value |
|-------|--------|
| **Site URL** | `https://eightfiftythreegrc.github.io/eightfiftythree-grc/app.html` |
| **Redirect URLs** | Same URL (add if missing) |

Without this, magic links in the email may not return users to the app.

#### Step 2 — Configure mail (GitHub Actions)

1. GitHub **Settings → Secrets and variables → Actions**
2. Secret **`SUPABASE_ACCESS_TOKEN`** — personal token from [Supabase Account → Tokens](https://supabase.com/dashboard/account/tokens) (`sbp_...`)
3. **Actions** → **Configure Supabase approver email** → **Run workflow** (branch `main`)

With **only** `SUPABASE_ACCESS_TOKEN`, the script:

- Patches auth email templates with policy-invite copy
- **Disables** the Send Email hook (default — mail goes through Supabase)
- Approver invites deliver to **any inbox**

**Or locally:**

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
node scripts/configure-supabase-email.mjs
```

#### Step 3 — Test

1. Hard-refresh `app.html`, signed in (cloud mode)
2. Program setup → ISP Step 3 → **Different approver** → real email (e.g. `nistcsftool@gmail.com`)
3. Click **Next** past Step 3
4. Toast: sign-up email sent
5. Approver clicks the link → lands on `app.html` → signs in with **that same email** → approves ISP

#### Optional — branded mail without buying a domain (SendGrid)

1. [SendGrid](https://sendgrid.com) → **Settings → Sender Authentication → Single Sender Verification** → verify your Gmail (or any address you control)
2. GitHub secrets/variables:

| Name | Type | Value |
|------|------|--------|
| `SUPABASE_ACCESS_TOKEN` | Secret | `sbp_...` |
| `SENDGRID_API_KEY` | Secret | SendGrid API key |
| `EMAIL_FROM` | Variable | `EightFiftyThree GRC <your-verified@gmail.com>` |

3. Re-run **Configure Supabase approver email** — deploys the auth hook + edge functions; branded copy goes through SendGrid.

#### Troubleshooting

| Symptom | Fix |
|---------|-----|
| Send Email hook errors | Re-run configure workflow with **no** `SENDGRID_API_KEY` to reset to built-in Supabase mail |
| `Edge Function returned a non-2xx` | Same as above — default path needs no edge functions |
| No mail at all | Supabase **Authentication → Logs**; confirm redirect URLs (Step 1) |
| Generic “Confirm your email” | Expected on default path — still works; use SendGrid (optional) for branded subject |
| Toast still shows errors | Hard-refresh app; check browser console for `sendISPApprovalRequestEmail` |

#### How the code sends mail

1. App calls `signInWithOtp` for the approver email (org/CISO stored in user metadata).
2. **Default:** Supabase sends the magic link directly — no domain, no third-party mail API.
3. **Optional:** Send Email hook → `auth-send-email` → SendGrid when `SENDGRID_API_KEY` + `EMAIL_FROM` are set.


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

## Misconfiguration

If `js/cloud-config.js` is blank or invalid, the app shows the sign-in gate with a configuration error. There is no offline/local-only fallback. The legacy Entra/MSAL feature under **Users & roles** (if configured separately) is independent of Supabase sign-in.
