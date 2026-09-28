-- Run ONLY in a disposable database as a superuser:
-- psql -v ON_ERROR_STOP=1 -d <test_database> -f tests/family-tree.sql
create schema auth;
do $$ begin
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;
create function auth.jwt() returns jsonb language sql stable as $$ select current_setting('request.jwt.claims', true)::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
grant usage on schema auth to authenticated, anon;
create table public.class_order (id integer primary key, class_name text unique not null);
insert into public.class_order values (1, 'Alpha'), (2, 'Beta'), (3, 'Gamma'), (4, 'Theta');
create table public.members (
  uniqname text primary key,
  name text,
  email_address text,
  admin boolean,
  current_class_number text references public.class_order(class_name)
);
insert into public.members (uniqname, name, email_address, admin, current_class_number) values
  ('a', 'Admin Member', 'admin@example.com', true, 'Alpha'),
  ('b', 'Regular Member', 'member@example.com', false, 'Beta'),
  ('c', 'C Member', 'c@example.com', false, null),
  ('d', 'D Member', 'd@example.com', false, null),
  ('e', 'Unconnected Member', 'e@example.com', false, null),
  ('sohank', 'Sohan K', 'sohank@umich.edu', false, null),
  ('__family_tree_person__:00000000-0000-0000-0000-000000000099', 'Reserved Key Member', 'reserved@example.com', false, null);
grant select on public.members to authenticated;
\ir ../supabase/migrations/202609270001_family_tree.sql
\ir ../supabase/migrations/202609270002_family_tree_editor_access.sql
\ir ../supabase/migrations/202609270003_family_tree_only_people.sql
\ir ../supabase/migrations/202609280001_family_tree_person_class.sql
\ir ../supabase/migrations/202609280002_delete_family_tree_person.sql
\ir ../supabase/migrations/202609280003_family_tree_member_class.sql
\ir ../supabase/migrations/202609280004_replace_family_relationship.sql
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@example.com"}';
select public.change_family_relationship('a','c');
select public.change_family_relationship('b','c');
select public.change_family_relationship('c','d');
select public.change_family_relationship('a','c');
do $$ begin
  if (select count(*) from public.family_relationships) <> 3 then raise exception 'Shared littles or idempotence failed'; end if;
  begin perform public.change_family_relationship('d','a'); raise exception 'Cycle accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.change_family_relationship('a','a'); raise exception 'Self link accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.change_family_relationship('a','missing'); raise exception 'Unknown member accepted'; exception when foreign_key_violation then null; end;
  begin insert into public.family_relationships(big_uniqname, little_uniqname) values ('a','d'); raise exception 'Direct write accepted'; exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000002","email":"member@example.com"}';
do $$ begin
  if (select count(*) from public.family_relationships) <> 3 then raise exception 'Member read failed'; end if;
  begin perform public.change_family_relationship('a','d'); raise exception 'Non-admin add accepted'; exception when insufficient_privilege then null; end;
  begin perform public.change_family_relationship('a','c',true); raise exception 'Non-admin removal accepted'; exception when insufficient_privilege then null; end;
  begin perform public.create_family_tree_person('Unauthorized Person'); raise exception 'Non-editor created a person'; exception when insufficient_privilege then null; end;
  begin perform public.update_family_tree_person('missing','Unauthorized Person','Beta'); raise exception 'Non-editor updated a person'; exception when insufficient_privilege then null; end;
  begin perform public.delete_family_tree_person('missing'); raise exception 'Non-editor deleted a person'; exception when insufficient_privilege then null; end;
  begin perform public.set_family_tree_member_class('c', 'Gamma'); raise exception 'Non-editor updated a member class'; exception when insufficient_privilege then null; end;
  begin perform public.replace_family_relationship('a', 'c', 'a', 'd'); raise exception 'Non-editor replaced a relationship'; exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000005","email":"sohank@umich.edu"}';
do $$ begin
  if (select admin from public.members where uniqname = 'sohank') then
    raise exception 'Tree editor was incorrectly granted site-wide admin.';
  end if;
  if not public.can_edit_family_tree() then
    raise exception 'Family-tree editor grant was not recognized.';
  end if;
  perform public.change_family_relationship('sohank','c');
  if public.set_family_tree_member_class('sohank', 'Beta') <> 'Beta' then
    raise exception 'Family-tree editor could not assign a missing member class.';
  end if;
  if (select current_class_number from public.members where uniqname = 'sohank') <> 'Beta' then
    raise exception 'Assigned class was not saved to the roster member.';
  end if;
  if public.set_family_tree_member_class('b', 'Gamma') <> 'Gamma' then
    raise exception 'Family-tree editor could not correct an existing member class.';
  end if;
  if (select current_class_number from public.members where uniqname = 'b') <> 'Gamma' then
    raise exception 'Corrected class was not saved to the roster member.';
  end if;
  begin
    perform public.replace_family_relationship('a', 'c', 'd', 'c');
    raise exception 'Replacement that creates a cycle was accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.replace_family_relationship('a', 'c', 'b', 'c');
    raise exception 'Replacement duplicated an existing relationship';
  exception when unique_violation then null; end;
  if not exists (
    select 1 from public.family_relationships
    where big_uniqname = 'a' and little_uniqname = 'c'
  ) then raise exception 'Failed replacement changed the original link.'; end if;
  perform public.replace_family_relationship('sohank', 'c', 'sohank', 'd');
  if exists (
    select 1 from public.family_relationships
    where big_uniqname = 'sohank' and little_uniqname = 'c'
  ) or not exists (
    select 1 from public.family_relationships
    where big_uniqname = 'sohank' and little_uniqname = 'd'
  ) then raise exception 'Relationship replacement did not update the selected endpoint.'; end if;
  perform public.replace_family_relationship('sohank', 'd', 'sohank', 'c');
  perform public.replace_family_relationship('sohank', 'c', 'e', 'c');
  if not exists (
    select 1 from public.family_relationships
    where big_uniqname = 'e' and little_uniqname = 'c'
  ) then raise exception 'Replacing the big endpoint failed.'; end if;
  perform public.replace_family_relationship('e', 'c', 'sohank', 'c');
  begin
    perform public.set_family_tree_member_class('e', 'Gamma');
    raise exception 'Unconnected roster member class was edited';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.set_family_tree_member_class('c', 'Theta');
    raise exception 'Excluded Theta class accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.set_family_tree_member_class(
      '__family_tree_person__:00000000-0000-0000-0000-000000000099', 'Gamma'
    );
    raise exception 'Reserved-looking member key accepted as a roster update';
  exception when invalid_parameter_value then null; end;
  perform public.change_family_relationship('sohank','c');
  if not exists (
    select 1 from public.family_relationships
    where big_uniqname = 'sohank' and little_uniqname = 'c'
  ) then raise exception 'Tree editor could not add a relationship.'; end if;
  perform public.change_family_relationship('sohank','c',true);
  perform public.change_family_relationship(
    'a', '__family_tree_person__:00000000-0000-0000-0000-000000000099'
  );
  begin
    perform public.delete_family_tree_person(
      '__family_tree_person__:00000000-0000-0000-0000-000000000099'
    );
    raise exception 'A real member with a reserved-looking key was deleted';
  exception when invalid_parameter_value then null; end;
  if not exists (
    select 1 from public.members
    where uniqname = '__family_tree_person__:00000000-0000-0000-0000-000000000099'
  ) or not exists (
    select 1 from public.family_relationships
    where big_uniqname = 'a'
      and little_uniqname = '__family_tree_person__:00000000-0000-0000-0000-000000000099'
  ) then
    raise exception 'Reserved-looking member data was changed by family-tree deletion.';
  end if;
  perform public.change_family_relationship(
    'a', '__family_tree_person__:00000000-0000-0000-0000-000000000099', true
  );
  if (select admin from public.members where uniqname = 'sohank') then
    raise exception 'Tree editor was granted site-wide admin access.';
  end if;
  if exists (
    select 1 from public.members where name = 'Family Tree Only Person'
  ) then
    raise exception 'Family-tree-only people were inserted into the ZProfile roster.';
  end if;
  begin
    insert into public.family_tree_editors values ('b');
    raise exception 'Tree editor could grant access to another member.';
  exception when insufficient_privilege then null; end;
end $$;
select public.create_family_tree_person('Family Tree Only Person', 'Gamma') as external_person_key \gset
select set_config('test.external_person_key', :'external_person_key', false);
select public.change_family_relationship('sohank', :'external_person_key');
select public.change_family_relationship('a', :'external_person_key');
do $$ begin
  if not exists (
    select 1 from public.family_tree_people
    where person_key = current_setting('test.external_person_key', true)
      and class_name = 'Gamma'
  ) then
    raise exception 'Created family-tree-only person or class could not be read.';
  end if;
  perform public.update_family_tree_person(
    current_setting('test.external_person_key', true),
    'Family Tree Person Updated',
    'Beta'
  );
  if not exists (
    select 1 from public.family_tree_people
    where person_key = current_setting('test.external_person_key', true)
      and name = 'Family Tree Person Updated'
      and class_name = 'Beta'
  ) then
    raise exception 'Family-tree-only person name or class could not be updated.';
  end if;
  begin
    perform public.update_family_tree_person(
      current_setting('test.external_person_key', true),
      'Family Tree Person Updated',
      'Unknown'
    );
    raise exception 'Unavailable update class accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.create_family_tree_person('Unknown Class Person', 'Unknown');
    raise exception 'Unavailable class accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.create_family_tree_person('Theta Person', 'Theta');
    raise exception 'Excluded Theta class accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.delete_family_tree_person('a');
    raise exception 'Real member was eligible for family-tree deletion';
  exception when invalid_parameter_value then null; end;
  if not exists (select 1 from public.members where uniqname = 'a') then
    raise exception 'Family-tree deletion removed a real member.';
  end if;
end $$;
select public.delete_family_tree_person(:'external_person_key');
do $$ begin
  if exists (
    select 1 from public.family_tree_people
    where person_key = current_setting('test.external_person_key', true)
  ) then
    raise exception 'Family-tree-only person was not deleted.';
  end if;
  if exists (
    select 1 from public.family_relationships
    where big_uniqname = current_setting('test.external_person_key', true)
       or little_uniqname = current_setting('test.external_person_key', true)
  ) then
    raise exception 'Deleting a family-tree-only person left relationships behind.';
  end if;
  if not exists (select 1 from public.members where uniqname = 'a') then
    raise exception 'Family-tree deletion removed a real member.';
  end if;
  if exists (select 1 from public.members where name = 'Family Tree Only Person') then
    raise exception 'Family-tree-only person appeared in public.members.';
  end if;
end $$;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000003","email":"outsider@example.com"}';
do $$ begin
  if (select count(*) from public.family_relationships) <> 0 then raise exception 'Outsider read accepted'; end if;
end $$;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@example.com"}';
select public.change_family_relationship('a','c',true);
do $$ begin
  if (select count(*) from public.family_relationships) <> 2 then raise exception 'Removal changed other edges'; end if;
end $$;
reset role;
delete from public.members where uniqname = 'c';
do $$ begin
  if exists (
    select 1 from public.family_relationships
    where big_uniqname = 'c' or little_uniqname = 'c'
  ) then raise exception 'Deleting a member did not cascade to family links'; end if;
end $$;
set role anon;
do $$ begin
  begin perform public.change_family_relationship('a','d'); raise exception 'Anonymous write accepted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
