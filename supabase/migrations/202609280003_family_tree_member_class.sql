-- Let family-tree editors set or correct the class on a connected roster row.
-- This narrowly scoped RPC cannot rename members or change other profile data.
begin;

create function public.set_family_tree_member_class(
  p_member_uniqname text,
  p_class_name text
)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  normalized_uniqname text;
  normalized_class text;
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only family-tree editors can update member classes.'
      using errcode = '42501';
  end if;

  normalized_uniqname := btrim(coalesce(p_member_uniqname, ''));
  if normalized_uniqname = ''
    or left(normalized_uniqname, length('__family_tree_person__:')) = '__family_tree_person__:' then
    raise exception 'Choose a ZProfile member to update.' using errcode = '22023';
  end if;

  select class_order.class_name into normalized_class
  from public.class_order as class_order
  where lower(class_order.class_name) = lower(btrim(coalesce(p_class_name, '')))
    and lower(class_order.class_name) <> 'theta'
  order by class_order.id
  limit 1;
  if normalized_class is null then
    raise exception 'Choose a class from the available classes.' using errcode = '22023';
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

commit;
