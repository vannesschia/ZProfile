-- Allow family-tree editors to remove only family_tree_people rows.
begin;

create function public.delete_family_tree_person(p_person_key text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only family-tree editors can delete people.' using errcode = '42501';
  end if;
  if p_person_key is null or position('__family_tree_person__:' in p_person_key) <> 1 then
    raise exception 'Only a family-tree-only person can be deleted here.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(726391204);
  if exists (
    select 1 from public.members where uniqname = p_person_key
  ) then
    raise exception 'ZProfile member accounts cannot be deleted from the family tree.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.family_tree_people where person_key = p_person_key
  ) then
    raise exception 'This family-tree-only person no longer exists.' using errcode = '22023';
  end if;

  delete from public.family_relationships
  where big_uniqname = p_person_key or little_uniqname = p_person_key;
  delete from public.family_tree_people where person_key = p_person_key;
end;
$$;
revoke all on function public.delete_family_tree_person(text) from public, anon;
grant execute on function public.delete_family_tree_person(text) to authenticated;

commit;
