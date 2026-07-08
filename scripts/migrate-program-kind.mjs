// scripts/migrate-program-kind.mjs
// Adds programs.program_kind for 800-53 vs CSF isolation in shared Supabase.
// Requires: SUPABASE_ACCESS_TOKEN (sbp_...) and optional SUPABASE_PROJECT_REF (defaults from cloud-config).

import fs from 'node:fs';

const API = 'https://api.supabase.com';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'mdysqwcbgfizzojqojwu';

const MIGRATION = `
alter table public.programs add column if not exists program_kind text;
create index if not exists programs_owner_kind_idx on public.programs (owner_id, program_kind);
update public.programs
set program_kind = coalesce(
  nullif(trim(state->>'programKind'), ''),
  case when state ? 'selectedCategories' then 'csf' when state ? 'baseline' then '800-53' else '800-53' end
)
where program_kind is null or trim(program_kind) = '';
`.trim();

if (!TOKEN.startsWith('sbp_')) {
  console.error('ERROR: Set SUPABASE_ACCESS_TOKEN (sbp_...) from https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) throw new Error(method + ' ' + path + ' -> ' + res.status + ' ' + text.slice(0, 400));
  try { return text ? JSON.parse(text) : null; } catch (_) { return text; }
}

async function main() {
  console.log('Applying program_kind migration to project', PROJECT_REF, '…');
  await api('POST', '/v1/projects/' + PROJECT_REF + '/database/query', { query: MIGRATION });
  console.log('Migration applied.');
}

main().catch((e) => {
  console.error('MIGRATION FAILED:', e.message);
  process.exit(1);
});
