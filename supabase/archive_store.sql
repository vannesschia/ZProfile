-- Run this in the Supabase SQL editor to create the archive table.
-- Archive data is synced for all users on the archive allowlist.

create table if not exists archive_store (
  key text primary key,
  value jsonb not null default '{}'
);

-- Optional: restrict access via RLS (your app already checks allowlist in API).
-- alter table archive_store enable row level security;
-- create policy "Allow read/write for authenticated" on archive_store
--   for all using (true);
