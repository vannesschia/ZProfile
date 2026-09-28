-- Replace one endpoint in a family-tree connection without removing other links.
begin;

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
    raise exception 'Only family-tree editors can change relationships.'
      using errcode = '42501';
  end if;

  if p_old_big is null or p_old_little is null
    or p_new_big is null or p_new_little is null
    or length(p_old_big) > 64 or length(p_old_little) > 64
    or length(p_new_big) > 64 or length(p_new_little) > 64
    or p_old_big = p_old_little or p_new_big = p_new_little then
    raise exception 'Choose two different people.' using errcode = '22023';
  end if;

  -- Serialize replacement with add/remove so cycle checks see a stable graph.
  perform pg_advisory_xact_lock(726391204);

  if not exists (
    select 1 from public.family_relationships
    where big_uniqname = p_old_big and little_uniqname = p_old_little
  ) then
    raise exception 'This relationship no longer exists. Refresh and try again.'
      using errcode = '22023';
  end if;

  if not exists (select 1 from public.members where uniqname = p_new_big)
    and not exists (select 1 from public.family_tree_people where person_key = p_new_big) then
    raise exception 'The selected big no longer exists.' using errcode = '23503';
  end if;
  if not exists (select 1 from public.members where uniqname = p_new_little)
    and not exists (select 1 from public.family_tree_people where person_key = p_new_little) then
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
    raise exception 'This relationship would create a cycle.' using errcode = '22023';
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

commit;
