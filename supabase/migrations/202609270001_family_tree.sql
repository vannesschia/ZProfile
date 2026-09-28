-- Apply to the existing ZProfile database. members.uniqname must be unique.
begin;
create unique index if not exists members_uniqname_family_tree_uidx
  on public.members(uniqname);

create table public.family_relationships (
  big_uniqname text not null references public.members(uniqname) on delete cascade,
  little_uniqname text not null references public.members(uniqname) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (big_uniqname, little_uniqname),
  check (big_uniqname <> little_uniqname)
);
create index family_relationships_little_idx on public.family_relationships(little_uniqname);
alter table public.family_relationships enable row level security;
create policy "Members can view family relationships" on public.family_relationships
  for select to authenticated using (
    exists (select 1 from public.members where lower(email_address) = lower(auth.jwt()->>'email'))
  );
-- All writes go through the checked function, including direct API clients.
revoke all on public.family_relationships from anon, authenticated;
grant select on public.family_relationships to authenticated;

create function public.change_family_relationship(p_big text, p_little text, p_remove boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.members where lower(email_address) = lower(auth.jwt()->>'email') and admin is true
  ) then
    raise exception 'Only admins can change family relationships.' using errcode = '42501';
  end if;
  if p_big is null or p_little is null or p_remove is null or p_big = p_little then
    raise exception 'Choose two different members.' using errcode = '22023';
  end if;
  -- Serialize mutations so simultaneous additions cannot create a cycle.
  perform pg_advisory_xact_lock(726391204);
  if p_remove then
    delete from public.family_relationships where big_uniqname = p_big and little_uniqname = p_little;
    return;
  end if;
  if exists (
    with recursive descendants(uniqname) as (
      select p_little
      union
      select r.little_uniqname from public.family_relationships r
      join descendants d on r.big_uniqname = d.uniqname
    ) select 1 from descendants where uniqname = p_big
  ) then
    raise exception 'This relationship would create a cycle.' using errcode = '22023';
  end if;
  insert into public.family_relationships(big_uniqname, little_uniqname) values (p_big, p_little)
    on conflict do nothing;
end;
$$;
revoke all on function public.change_family_relationship(text, text, boolean) from public, anon;
grant execute on function public.change_family_relationship(text, text, boolean) to authenticated;
commit;
