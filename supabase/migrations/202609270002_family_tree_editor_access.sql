-- Grant family-tree editing without changing the member's site-wide admin flag.
begin;

create table public.family_tree_editors (
  member_uniqname text primary key
    references public.members(uniqname) on delete cascade
);
alter table public.family_tree_editors enable row level security;
revoke all on table public.family_tree_editors
  from public, anon, authenticated, service_role;

do $$ begin
  if not exists (select 1 from public.members where uniqname = 'sohank') then
    raise exception 'Cannot grant family-tree access: member uniqname sohank does not exist.';
  end if;
end $$;

insert into public.family_tree_editors(member_uniqname)
values ('sohank');

create function public.can_edit_family_tree()
returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1
    from public.members as member
    where lower(member.email_address) = lower(auth.jwt()->>'email')
      and (
        member.admin is true
        or exists (
          select 1
          from public.family_tree_editors as editor
          where editor.member_uniqname = member.uniqname
        )
      )
  );
$$;
revoke all on function public.can_edit_family_tree() from public, anon;
grant execute on function public.can_edit_family_tree() to authenticated;

create or replace function public.change_family_relationship(
  p_big text,
  p_little text,
  p_remove boolean default false
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only family-tree editors can change relationships.' using errcode = '42501';
  end if;
  if p_big is null or p_little is null or p_remove is null or p_big = p_little then
    raise exception 'Choose two different members.' using errcode = '22023';
  end if;
  -- Serialize mutations so simultaneous additions cannot create a cycle.
  perform pg_advisory_xact_lock(726391204);
  if p_remove then
    delete from public.family_relationships
    where big_uniqname = p_big and little_uniqname = p_little;
    return;
  end if;
  if exists (
    with recursive descendants(uniqname) as (
      select p_little
      union
      select relationship.little_uniqname
      from public.family_relationships as relationship
      join descendants on relationship.big_uniqname = descendants.uniqname
    )
    select 1 from descendants where uniqname = p_big
  ) then
    raise exception 'This relationship would create a cycle.' using errcode = '22023';
  end if;
  insert into public.family_relationships(big_uniqname, little_uniqname)
  values (p_big, p_little)
  on conflict do nothing;
end;
$$;
revoke all on function public.change_family_relationship(text, text, boolean)
  from public, anon;
grant execute on function public.change_family_relationship(text, text, boolean)
  to authenticated;

commit;
