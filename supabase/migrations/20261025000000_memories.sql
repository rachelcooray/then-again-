-- "Did you have one?" answers, and the new usage events for the hidden link, saved stories
-- and where players grew up.

-- Answers carry the puzzle and yes or no only: nothing about who answered.
create table public.memory_votes (
  id bigint generated always as identity primary key,
  puzzle_id text not null check (length(puzzle_id) between 1 and 80),
  had_one boolean not null,
  received_at timestamptz not null default now()
);
create index memory_votes_puzzle on public.memory_votes (puzzle_id);

alter table public.memory_votes enable row level security;
create policy "anyone can answer" on public.memory_votes for insert to anon, authenticated with check (true);
create policy "admins read answers" on public.memory_votes for select to authenticated using (public.is_admin());
grant insert on public.memory_votes to anon, authenticated;

-- Players can read the totals for a puzzle, never the rows.
create or replace function public.memory_vote_counts(p_puzzle_id text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'yes', count(*) filter (where had_one),
    'no', count(*) filter (where not had_one))
  from public.memory_votes where puzzle_id = p_puzzle_id;
$$;
revoke all on function public.memory_vote_counts(text) from public;
grant execute on function public.memory_vote_counts(text) to anon, authenticated;

-- Until a puzzle has this many answers, the app shows the count rather than a percentage.
insert into public.app_config (key, value) values ('vote_percent_after', '200');

alter table public.analytics_events drop constraint analytics_events_name_check;
alter table public.analytics_events add constraint analytics_events_name_check check (name in (
  'first_open', 'daily_visit', 'puzzle_complete', 'set_complete', 'link_result', 'story_saved',
  'region_choice', 'reminder_choice', 'visit_end'));
