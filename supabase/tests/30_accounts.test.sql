-- Accounts: players see only their own save and can delete themselves; admin tools are admins only.
\set ON_ERROR_STOP on

create function pg_temp.expect_error(sql text, needle text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if position(needle in sqlerrm) = 0 then raise exception 'Expected an error containing "%", got: %', needle, sqlerrm; end if;
    return;
  end;
  raise exception 'Expected an error containing "%", but it succeeded: %', needle, sql;
end $$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000b1', 'ada@example.com'),
  ('00000000-0000-0000-0000-0000000000b2', 'ben@example.com'),
  ('00000000-0000-0000-0000-0000000000c1', 'rachel@example.com');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000c1');
grant execute on function pg_temp.expect_error(text, text) to authenticated, anon;

-- 1. Ada saves her progress and reads it back; Ben can't see it or overwrite it.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', false);
insert into public.player_saves (data) values ('{"progress": {"2026-10-26:word-guess": {}, "2026-10-26:sudoku": {}}}');
do $$ begin
  if (select count(*) from public.player_saves) <> 1 then raise exception 'Ada should see her save'; end if;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', false);
do $$ begin
  if (select count(*) from public.player_saves) <> 0 then raise exception 'Ben must not see Ada''s save'; end if;
end $$;
select pg_temp.expect_error($$insert into public.player_saves (player, data) values ('00000000-0000-0000-0000-0000000000b1', '{}')$$, 'row-level security');

-- 2. Admin tools refuse players.
select pg_temp.expect_error($$select public.admin_find_player('ada@example.com')$$, 'Admins only');
select pg_temp.expect_error($$select public.admin_usage_summary()$$, 'Admins only');
select pg_temp.expect_error($$insert into public.content_reviews (puzzle_id, decision) values ('sudoku-2026-10-26', 'approved')$$, 'row-level security');

-- 3. An admin finds Ada, records a review decision and reads the pilot numbers.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
do $$ begin
  if (public.admin_find_player('ADA@example.com ') ->> 'results')::int <> 2 then raise exception 'Expected Ada with two results'; end if;
  if public.admin_find_player('nobody@example.com') is not null then raise exception 'Expected no player'; end if;
  if (public.admin_usage_summary() ->> 'accounts')::int <> 3 then raise exception 'Expected three accounts'; end if;
end $$;
insert into public.content_reviews (puzzle_id, decision, note) values ('word-guess-2026-10-26', 'changes', 'Clue is too easy');

-- 4. Ben deletes his own account; an admin deletes Ada's on request.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', false);
select public.delete_my_account();
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
select public.admin_delete_player('00000000-0000-0000-0000-0000000000b1');
reset role;
do $$ begin
  if exists (select 1 from auth.users where email in ('ada@example.com', 'ben@example.com')) then raise exception 'Accounts should be gone'; end if;
  if exists (select 1 from public.player_saves) then raise exception 'Saves should be gone'; end if;
end $$;
\echo 'accounts: all checks passed'
