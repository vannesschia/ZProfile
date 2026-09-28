-- Add family-tree-only people without inserting them into the ZProfile roster.
begin;

create table public.family_tree_people (
  person_key text primary key
    check (person_key ~ '^__family_tree_person__:[0-9a-f-]{36}$'),
  name text not null check (length(btrim(name)) between 2 and 120),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
alter table public.family_tree_people enable row level security;
create policy "Members can view family-tree-only people"
  on public.family_tree_people for select to authenticated using (
    exists (
      select 1 from public.members
      where lower(email_address) = lower(auth.jwt()->>'email')
    )
  );
revoke all on public.family_tree_people from public, anon, authenticated;
grant select on public.family_tree_people to authenticated;
grant all on public.family_tree_people to service_role;

-- Relationship endpoints can now be either a member uniqname or a private
-- family-tree key. Restore the previous member-delete cascade with a trigger.
do $$
declare
  fk record;
begin
  for fk in
    select constraint_row.conname
    from pg_constraint as constraint_row
    where constraint_row.conrelid = 'public.family_relationships'::regclass
      and constraint_row.confrelid = 'public.members'::regclass
      and constraint_row.contype = 'f'
  loop
    execute format(
      'alter table public.family_relationships drop constraint %I',
      fk.conname
    );
  end loop;
end;
$$;

create function public.create_family_tree_person(p_name text)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  normalized_name text;
  new_person_key text;
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only family-tree editors can add people.' using errcode = '42501';
  end if;
  normalized_name := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  if length(normalized_name) < 2 or length(normalized_name) > 120 then
    raise exception 'Enter a full name between 2 and 120 characters.' using errcode = '22023';
  end if;

  new_person_key := '__family_tree_person__:' || gen_random_uuid()::text;
  insert into public.family_tree_people(person_key, name)
  values (new_person_key, normalized_name);
  return new_person_key;
end;
$$;
revoke all on function public.create_family_tree_person(text) from public, anon;
grant execute on function public.create_family_tree_person(text) to authenticated;

create function public.validate_family_relationship_endpoints()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.members where uniqname = new.big_uniqname)
    and not exists (select 1 from public.family_tree_people where person_key = new.big_uniqname) then
    raise exception 'The selected big does not exist.' using errcode = '23503';
  end if;
  if not exists (select 1 from public.members where uniqname = new.little_uniqname)
    and not exists (select 1 from public.family_tree_people where person_key = new.little_uniqname) then
    raise exception 'The selected little does not exist.' using errcode = '23503';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_family_relationship_endpoints() from public, anon, authenticated;
create trigger family_relationships_validate_endpoints
  before insert or update on public.family_relationships
  for each row execute function public.validate_family_relationship_endpoints();

create function public.prevent_family_member_key_update()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.uniqname is distinct from new.uniqname and exists (
    select 1 from public.family_relationships
    where big_uniqname = old.uniqname or little_uniqname = old.uniqname
  ) then
    raise exception 'Remove family-tree relationships before changing a member uniqname.'
      using errcode = '23503';
  end if;
  return new;
end;
$$;
revoke all on function public.prevent_family_member_key_update() from public, anon, authenticated;
create trigger family_relationships_prevent_member_key_update
  before update of uniqname on public.members
  for each row execute function public.prevent_family_member_key_update();

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
    raise exception 'Choose two different people.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(726391204);

  if p_remove then
    delete from public.family_relationships
    where big_uniqname = p_big and little_uniqname = p_little;
    return;
  end if;

  if not exists (select 1 from public.members where uniqname = p_big)
    and not exists (select 1 from public.family_tree_people where person_key = p_big) then
    raise exception 'The selected big no longer exists.' using errcode = '23503';
  end if;
  if not exists (select 1 from public.members where uniqname = p_little)
    and not exists (select 1 from public.family_tree_people where person_key = p_little) then
    raise exception 'The selected little no longer exists.' using errcode = '23503';
  end if;

  if exists (
    with recursive descendants(person_key) as (
      select p_little
      union
      select relationship.little_uniqname
      from public.family_relationships as relationship
      join descendants on relationship.big_uniqname = descendants.person_key
    )
    select 1 from descendants where person_key = p_big
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

create function public.cascade_family_relationships_member_delete()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.family_relationships
  where big_uniqname = old.uniqname or little_uniqname = old.uniqname;
  return old;
end;
$$;
revoke all on function public.cascade_family_relationships_member_delete() from public, anon, authenticated;
create trigger family_relationships_member_delete
  after delete on public.members
  for each row execute function public.cascade_family_relationships_member_delete();

commit;
