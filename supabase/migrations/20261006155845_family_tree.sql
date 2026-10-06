begin;

create table public.family_tree_people (
  person_key text primary key
    check (person_key ~ '^__family_tree_person__:[0-9a-f-]{36}$'),
  name text not null check (length(btrim(name)) between 2 and 120),
  class_name text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
alter table public.family_tree_people enable row level security;
create policy "Members can view family-tree-only people"
  on public.family_tree_people for select to authenticated using (
    exists (
      select 1 from public.members as member
      where lower(member.uniqname) = lower(split_part(auth.jwt()->>'email', '@', 1))
    )
  );
revoke all on public.family_tree_people from public, anon, authenticated;
grant select on public.family_tree_people to authenticated;
grant all on public.family_tree_people to service_role;

create table public.family_relationships (
  big_uniqname text not null,
  little_uniqname text not null,
  created_at timestamptz not null default now(),
  primary key (big_uniqname, little_uniqname),
  check (big_uniqname <> little_uniqname)
);
create index family_relationships_little_idx
  on public.family_relationships(little_uniqname);
alter table public.family_relationships enable row level security;
create policy "Members can view family relationships"
  on public.family_relationships for select to authenticated using (
    exists (
      select 1 from public.members as member
      where lower(member.uniqname) = lower(split_part(auth.jwt()->>'email', '@', 1))
    )
  );
revoke all on public.family_relationships from public, anon, authenticated;
grant select on public.family_relationships to authenticated;

create function public.can_edit_family_tree()
returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.members as member
    where lower(member.uniqname) = lower(split_part(auth.jwt()->>'email', '@', 1))
      and member.admin is true
  );
$$;
revoke all on function public.can_edit_family_tree() from public, anon;
grant execute on function public.can_edit_family_tree() to authenticated;

create function public.validate_family_relationship_endpoints()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.members where uniqname = new.big_uniqname
  ) and not exists (
    select 1 from public.family_tree_people where person_key = new.big_uniqname
  ) then
    raise exception 'The selected big does not exist.' using errcode = '23503';
  end if;
  if not exists (
    select 1 from public.members where uniqname = new.little_uniqname
  ) and not exists (
    select 1 from public.family_tree_people where person_key = new.little_uniqname
  ) then
    raise exception 'The selected little does not exist.' using errcode = '23503';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_family_relationship_endpoints()
  from public, anon, authenticated;
create trigger family_relationships_validate_endpoints
  before insert or update on public.family_relationships
  for each row execute function public.validate_family_relationship_endpoints();

create function public.change_family_relationship(
  p_big text,
  p_little text,
  p_remove boolean default false
)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only admins can change family relationships.'
      using errcode = '42501';
  end if;
  if p_big is null or p_little is null or p_remove is null
    or length(p_big) > 64 or length(p_little) > 64 or p_big = p_little then
    raise exception 'Choose two different people.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(726391204);
  if p_remove then
    delete from public.family_relationships
    where big_uniqname = p_big and little_uniqname = p_little;
    return;
  end if;

  if not exists (select 1 from public.members where uniqname = p_big)
    and not exists (
      select 1 from public.family_tree_people where person_key = p_big
    ) then
    raise exception 'The selected big no longer exists.' using errcode = '23503';
  end if;
  if not exists (select 1 from public.members where uniqname = p_little)
    and not exists (
      select 1 from public.family_tree_people where person_key = p_little
    ) then
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
    raise exception 'This relationship would create a cycle.'
      using errcode = '22023';
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

create function public.replace_family_relationship(
  p_old_big text,
  p_old_little text,
  p_new_big text,
  p_new_little text
)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only admins can change family relationships.'
      using errcode = '42501';
  end if;
  if p_old_big is null or p_old_little is null
    or p_new_big is null or p_new_little is null
    or length(p_old_big) > 64 or length(p_old_little) > 64
    or length(p_new_big) > 64 or length(p_new_little) > 64
    or p_old_big = p_old_little or p_new_big = p_new_little then
    raise exception 'Choose two different people.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(726391204);
  if not exists (
    select 1 from public.family_relationships
    where big_uniqname = p_old_big and little_uniqname = p_old_little
  ) then
    raise exception 'This relationship no longer exists. Refresh and try again.'
      using errcode = '22023';
  end if;
  if not exists (select 1 from public.members where uniqname = p_new_big)
    and not exists (
      select 1 from public.family_tree_people where person_key = p_new_big
    ) then
    raise exception 'The selected big no longer exists.' using errcode = '23503';
  end if;
  if not exists (select 1 from public.members where uniqname = p_new_little)
    and not exists (
      select 1 from public.family_tree_people where person_key = p_new_little
    ) then
    raise exception 'The selected little no longer exists.' using errcode = '23503';
  end if;
  if p_old_big = p_new_big and p_old_little = p_new_little then
    return;
  end if;

  if exists (
    select 1 from public.family_relationships
    where big_uniqname = p_new_big and little_uniqname = p_new_little
      and not (big_uniqname = p_old_big and little_uniqname = p_old_little)
  ) then
    raise exception 'This relationship already exists.' using errcode = '23505';
  end if;
  if exists (
    with recursive descendants(person_key) as (
      select p_new_little
      union
      select relationship.little_uniqname
      from public.family_relationships as relationship
      join descendants on relationship.big_uniqname = descendants.person_key
      where not (
        relationship.big_uniqname = p_old_big
        and relationship.little_uniqname = p_old_little
      )
    )
    select 1 from descendants where person_key = p_new_big
  ) then
    raise exception 'This relationship would create a cycle.'
      using errcode = '22023';
  end if;

  update public.family_relationships
  set big_uniqname = p_new_big, little_uniqname = p_new_little
  where big_uniqname = p_old_big and little_uniqname = p_old_little;
  if not found then
    raise exception 'This relationship no longer exists. Refresh and try again.'
      using errcode = '22023';
  end if;
end;
$$;
revoke all on function public.replace_family_relationship(text, text, text, text)
  from public, anon;
grant execute on function public.replace_family_relationship(text, text, text, text)
  to authenticated;

create function public.create_family_tree_person(
  p_name text,
  p_class_name text default null
)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  normalized_name text;
  normalized_class text;
  requested_class text;
  current_class text;
  new_person_key text;
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only admins can add family-tree people.'
      using errcode = '42501';
  end if;
  normalized_name := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  if length(normalized_name) < 2 or length(normalized_name) > 120 then
    raise exception 'Enter a full name between 2 and 120 characters.'
      using errcode = '22023';
  end if;

  requested_class := nullif(btrim(coalesce(p_class_name, '')), '');
  select requirements.current_class into current_class
  from public.requirements as requirements
  where requirements.id = true;
  select class_order.class_name into normalized_class
  from public.class_order as class_order
  where lower(class_order.class_name) = lower(coalesce(requested_class, ''))
    and (
      current_class is null
      or lower(class_order.class_name) <> lower(current_class)
    )
  order by class_order.id
  limit 1;
  if requested_class is not null and normalized_class is null then
    raise exception 'Choose a class from the available classes.'
      using errcode = '22023';
  end if;

  new_person_key := '__family_tree_person__:' || gen_random_uuid()::text;
  insert into public.family_tree_people(person_key, name, class_name)
  values (new_person_key, normalized_name, normalized_class);
  return new_person_key;
end;
$$;
revoke all on function public.create_family_tree_person(text, text)
  from public, anon;
grant execute on function public.create_family_tree_person(text, text)
  to authenticated;

create function public.update_family_tree_person(
  p_person_key text,
  p_name text,
  p_class_name text default null
)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  normalized_name text;
  normalized_class text;
  requested_class text;
  current_class text;
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only admins can edit family-tree people.'
      using errcode = '42501';
  end if;
  normalized_name := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  if length(normalized_name) < 2 or length(normalized_name) > 120 then
    raise exception 'Enter a full name between 2 and 120 characters.'
      using errcode = '22023';
  end if;

  requested_class := nullif(btrim(coalesce(p_class_name, '')), '');
  select requirements.current_class into current_class
  from public.requirements as requirements
  where requirements.id = true;
  select class_order.class_name into normalized_class
  from public.class_order as class_order
  where lower(class_order.class_name) = lower(coalesce(requested_class, ''))
    and (
      current_class is null
      or lower(class_order.class_name) <> lower(current_class)
    )
  order by class_order.id
  limit 1;
  if requested_class is not null and normalized_class is null then
    raise exception 'Choose a class from the available classes.'
      using errcode = '22023';
  end if;

  update public.family_tree_people
  set name = normalized_name, class_name = normalized_class
  where person_key = p_person_key;
  if not found then
    raise exception 'This family-tree-only person no longer exists.'
      using errcode = '22023';
  end if;
  return p_person_key;
end;
$$;
revoke all on function public.update_family_tree_person(text, text, text)
  from public, anon;
grant execute on function public.update_family_tree_person(text, text, text)
  to authenticated;

create function public.delete_family_tree_person(p_person_key text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only admins can delete family-tree people.'
      using errcode = '42501';
  end if;
  if p_person_key is null
    or position('__family_tree_person__:' in p_person_key) <> 1 then
    raise exception 'Only a family-tree-only person can be deleted here.'
      using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(726391204);
  if exists (select 1 from public.members where uniqname = p_person_key) then
    raise exception 'ZProfile member accounts cannot be deleted from the family tree.'
      using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.family_tree_people where person_key = p_person_key
  ) then
    raise exception 'This family-tree-only person no longer exists.'
      using errcode = '22023';
  end if;

  delete from public.family_relationships
  where big_uniqname = p_person_key or little_uniqname = p_person_key;
  delete from public.family_tree_people where person_key = p_person_key;
end;
$$;
revoke all on function public.delete_family_tree_person(text) from public, anon;
grant execute on function public.delete_family_tree_person(text) to authenticated;

create function public.set_family_tree_member_class(
  p_member_uniqname text,
  p_class_name text
)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  normalized_uniqname text;
  normalized_class text;
  current_class text;
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only admins can update member classes.'
      using errcode = '42501';
  end if;

  normalized_uniqname := btrim(coalesce(p_member_uniqname, ''));
  if normalized_uniqname = ''
    or left(normalized_uniqname, length('__family_tree_person__:'))
      = '__family_tree_person__:' then
    raise exception 'Choose a ZProfile member to update.'
      using errcode = '22023';
  end if;
  select requirements.current_class into current_class
  from public.requirements as requirements
  where requirements.id = true;
  select class_order.class_name into normalized_class
  from public.class_order as class_order
  where lower(class_order.class_name) = lower(btrim(coalesce(p_class_name, '')))
    and (
      current_class is null
      or lower(class_order.class_name) <> lower(current_class)
    )
  order by class_order.id
  limit 1;
  if normalized_class is null then
    raise exception 'Choose a class from the available classes.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.family_relationships
    where big_uniqname = normalized_uniqname
      or little_uniqname = normalized_uniqname
  ) then
    raise exception 'This member is not connected to the family tree.'
      using errcode = '22023';
  end if;
  update public.members
  set current_class_number = normalized_class
  where uniqname = normalized_uniqname;
  if not found then
    raise exception 'This member no longer exists.' using errcode = '22023';
  end if;
  return normalized_class;
end;
$$;
revoke all on function public.set_family_tree_member_class(text, text)
  from public, anon;
grant execute on function public.set_family_tree_member_class(text, text)
  to authenticated;

create function public.cascade_family_member_uniqname_update()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.uniqname is distinct from new.uniqname then
    update public.family_relationships
    set big_uniqname = new.uniqname
    where big_uniqname = old.uniqname;
    update public.family_relationships
    set little_uniqname = new.uniqname
    where little_uniqname = old.uniqname;
  end if;
  return new;
end;
$$;
revoke all on function public.cascade_family_member_uniqname_update()
  from public, anon, authenticated;
create trigger family_relationships_member_uniqname_update
  after update of uniqname on public.members
  for each row execute function public.cascade_family_member_uniqname_update();

create function public.cascade_family_relationships_member_delete()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.family_relationships
  where big_uniqname = old.uniqname or little_uniqname = old.uniqname;
  return old;
end;
$$;
revoke all on function public.cascade_family_relationships_member_delete()
  from public, anon, authenticated;
create trigger family_relationships_member_delete
  after delete on public.members
  for each row execute function public.cascade_family_relationships_member_delete();

commit;
