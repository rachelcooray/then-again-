-- Checks the rules the brief makes non-negotiable. Any failure raises and stops the run.
\set ON_ERROR_STOP on

-- Helpers
create function pg_temp.expect_error(sql text, needle text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if position(needle in sqlerrm) = 0 then
      raise exception 'Expected an error containing "%", got: %', needle, sqlerrm;
    end if;
    return;
  end;
  raise exception 'Expected an error containing "%", but the statement succeeded: %', needle, sql;
end $$;

insert into public.themes (id, issue, name, description, headline) values ('school-days', 23, 'School days', 'Chalk dust.', 'Four puzzles.');

-- 1. New puzzles start in the gate, not approved.
select pg_temp.expect_error($$insert into public.puzzles (format_id, difficulty, payload, solution, content_hash, status) values ('sudoku', 1, '{}', '{}', 'h0', 'approved')$$, 'start as generated');

insert into public.puzzles (id, format_id, difficulty, payload, solution, content_hash)
values ('00000000-0000-0000-0000-000000000001', 'sudoku', 1, '{"a":1}', '{"s":1}', 'h1'),
       ('00000000-0000-0000-0000-000000000002', 'word-guess', 1, '{"a":2}', '{"s":2}', 'h2');

-- 2. The status workflow can't be skipped.
select pg_temp.expect_error($$update public.puzzles set status = 'published' where content_hash = 'h1'$$, 'can''t go from generated to published');
update public.puzzles set status = 'screening' where content_hash in ('h1', 'h2');
update public.puzzles set status = 'approved' where content_hash = 'h1';
update public.puzzles set status = 'needs_review' where content_hash = 'h2';

-- 3. Only approved puzzles can be scheduled.
select pg_temp.expect_error($$insert into public.daily_sets (date, theme_id, puzzle_ids) values (current_date, 'school-days', '{00000000-0000-0000-0000-000000000002}')$$, 'not approved');
insert into public.daily_sets (date, theme_id, puzzle_ids) values ((now() at time zone 'utc')::date, 'school-days', '{00000000-0000-0000-0000-000000000001}');
do $$ begin
  if (select status from public.puzzles where content_hash = 'h1') <> 'scheduled' then raise exception 'Scheduling should mark the puzzle scheduled'; end if;
end $$;

-- 4. Approved content can't be edited in place.
select pg_temp.expect_error($$update public.puzzles set payload = '{"a":9}' where content_hash = 'h1'$$, 'send');

-- 5. Nothing is visible before publishing; publishing makes today's set readable without solutions.
do $$ begin
  if public.get_daily_set((now() at time zone 'utc')::date) is not null then raise exception 'Unpublished set leaked'; end if;
  if public.publish_due_sets() <> 1 then raise exception 'Expected one puzzle published'; end if;
  if public.get_daily_set((now() at time zone 'utc')::date) -> 'puzzles' -> 0 ? 'solution' then raise exception 'Solution leaked'; end if;
  if jsonb_array_length(public.get_daily_set((now() at time zone 'utc')::date) -> 'puzzles') <> 1 then raise exception 'Expected one puzzle in the set'; end if;
end $$;

-- 6. Future sets stay hidden even if published early by mistake.
insert into public.puzzles (id, format_id, difficulty, payload, solution, content_hash, status)
values ('00000000-0000-0000-0000-000000000003', 'sudoku', 2, '{}', '{}', 'h3', 'screening');
update public.puzzles set status = 'approved' where content_hash = 'h3';
insert into public.daily_sets (date, puzzle_ids, published) values ((now() at time zone 'utc')::date + 5, '{00000000-0000-0000-0000-000000000003}', true);
do $$ begin
  if public.get_daily_set((now() at time zone 'utc')::date + 5) is not null then raise exception 'A future set was readable'; end if;
end $$;

-- 7. The runway alert fires under 30 days.
select public.check_runway();
do $$ begin
  if not exists (select 1 from public.alerts where kind = 'runway' and resolved_at is null) then raise exception 'Expected a runway alert'; end if;
end $$;

-- 8. Gems can't go negative and a payout can't be made twice.
insert into public.wallet (player, balance) values ('00000000-0000-0000-0000-0000000000aa', 5);
select pg_temp.expect_error($$update public.wallet set balance = -1$$, 'check');
insert into public.gem_transactions (player, delta, kind, reason, idempotency_key) values ('00000000-0000-0000-0000-0000000000aa', 5, 'earned', 'solve', 'solve:p1');
select pg_temp.expect_error($$insert into public.gem_transactions (player, delta, kind, reason, idempotency_key) values ('00000000-0000-0000-0000-0000000000aa', 5, 'earned', 'solve', 'solve:p1')$$, 'duplicate');

-- 9. Players (anon) can send reports but can't read them, or read content directly.
set role anon;
insert into public.client_errors (message, app_version, platform, occurred_at) values ('boom', '0.1.0', 'web', now());
insert into public.analytics_events (name, props, app_version, platform, local_date) values ('first_open', '{"cohort":"2026-10-24"}', '0.1.0', 'web', '2026-10-24');
insert into public.feedback (message, app_version, platform) values ('Love it', '0.1.0', 'ios');
select pg_temp.expect_error($$insert into public.analytics_events (name, app_version, platform, local_date) values ('track_me', '0.1.0', 'web', current_date)$$, 'check');
select pg_temp.expect_error($$select count(*) from public.client_errors$$, 'permission denied');
select pg_temp.expect_error($$select count(*) from public.puzzles$$, 'permission denied');
select pg_temp.expect_error($$select count(*) from public.feedback$$, 'permission denied');
do $$ begin
  if (select count(*) from public.app_config) < 6 then raise exception 'anon should read public switches'; end if;
  if public.get_daily_set((now() at time zone 'utc')::date) is null then raise exception 'anon should read today''s set'; end if;
end $$;
select pg_temp.expect_error($$select public.publish_due_sets()$$, 'permission denied');
reset role;

-- 10. Admins can read content; other signed-in players can't.
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000ad');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000ad';
do $$ begin
  if (select count(*) from public.puzzles) <> 3 then raise exception 'admin should see all puzzles'; end if;
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000bb';
do $$ begin
  if (select count(*) from public.puzzles) <> 0 then raise exception 'a non-admin could see puzzles'; end if;
end $$;
reset role;

\echo 'All schema checks passed.'
