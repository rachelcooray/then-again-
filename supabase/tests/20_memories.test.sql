-- "Did you have one?" answers: anyone can add one, nobody can read the rows, everyone can read the totals.
\set ON_ERROR_STOP on

set role anon;
insert into public.memory_votes (puzzle_id, had_one) values ('word-guess-2026-10-26', true), ('word-guess-2026-10-26', true), ('word-guess-2026-10-26', false);
do $$ begin
  if public.memory_vote_counts('word-guess-2026-10-26') <> '{"yes": 2, "no": 1}'::jsonb then
    raise exception 'Unexpected totals: %', public.memory_vote_counts('word-guess-2026-10-26');
  end if;
  if public.memory_vote_counts('nothing-yet') <> '{"yes": 0, "no": 0}'::jsonb then raise exception 'Empty totals should be zero'; end if;
end $$;
do $$ begin
  perform * from public.memory_votes;
  raise exception 'Anonymous players must not read answer rows';
exception when insufficient_privilege then null;
end $$;
-- New usage events are accepted.
insert into public.analytics_events (name, props, app_version, platform, local_date) values ('link_result', '{"solved": true}', '0.1.0', 'web', '2026-10-26');
reset role;
\echo 'memories: all checks passed'
