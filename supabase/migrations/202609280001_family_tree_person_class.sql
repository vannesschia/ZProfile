-- Let family-tree-only people retain a class without creating a ZProfile member.
begin;

alter table public.family_tree_people
  add column class_name text;

drop function public.create_family_tree_person(text);

create function public.create_family_tree_person(
  p_name text,
  p_class_name text default null
)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  normalized_name text;
  normalized_class text;
  new_person_key text;
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only family-tree editors can add people.' using errcode = '42501';
  end if;
  normalized_name := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  if length(normalized_name) < 2 or length(normalized_name) > 120 then
    raise exception 'Enter a full name between 2 and 120 characters.' using errcode = '22023';
  end if;

  normalized_class := nullif(btrim(coalesce(p_class_name, '')), '');
  if normalized_class is not null and not exists (
    select 1 from public.class_order
    where class_name = normalized_class and lower(class_name) <> 'theta'
  ) then
    raise exception 'Choose a class from the available classes.' using errcode = '22023';
  end if;

  new_person_key := '__family_tree_person__:' || gen_random_uuid()::text;
  insert into public.family_tree_people(person_key, name, class_name)
  values (new_person_key, normalized_name, normalized_class);
  return new_person_key;
end;
$$;
revoke all on function public.create_family_tree_person(text, text) from public, anon;
grant execute on function public.create_family_tree_person(text, text) to authenticated;

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
begin
  if not public.can_edit_family_tree() then
    raise exception 'Only family-tree editors can edit people.' using errcode = '42501';
  end if;
  normalized_name := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  if length(normalized_name) < 2 or length(normalized_name) > 120 then
    raise exception 'Enter a full name between 2 and 120 characters.' using errcode = '22023';
  end if;
  normalized_class := nullif(btrim(coalesce(p_class_name, '')), '');
  if normalized_class is not null and not exists (
    select 1 from public.class_order
    where class_name = normalized_class and lower(class_name) <> 'theta'
  ) then
    raise exception 'Choose a class from the available classes.' using errcode = '22023';
  end if;

  update public.family_tree_people
  set name = normalized_name, class_name = normalized_class
  where person_key = p_person_key;
  if not found then
    raise exception 'This family-tree-only person no longer exists.' using errcode = '22023';
  end if;
  return p_person_key;
end;
$$;
revoke all on function public.update_family_tree_person(text, text, text) from public, anon;
grant execute on function public.update_family_tree_person(text, text, text) to authenticated;

commit;
