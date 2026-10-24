-- Then Again: initial schema (brief sections 5, 6, 8 and the launch tooling).
-- Apply with `supabase db push`. Tested locally with `npm run test:db`.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admins: who may see and change content. Add a row per person after they sign in once.
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key,
  added_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table public.themes (
  id text primary key,
  issue integer not null,
  name text not null,
  description text not null,
  headline text not null,
  artwork jsonb not null default '{}',
  formats text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- generated -> screening -> rejected | needs_review -> approved -> scheduled -> published.
-- quarantined takes a puzzle out of circulation at any point after approval.
create type public.puzzle_status as enum
  ('generated', 'screening', 'rejected', 'needs_review', 'approved', 'scheduled', 'published', 'quarantined');

create table public.puzzles (
  id uuid primary key default gen_random_uuid(),
  format_id text not null,
  theme_id text references public.themes (id),
  difficulty smallint not null check (difficulty between 1 and 3),
  est_minutes smallint,
  -- Everything the app needs to play, delivered sealed so answers aren't readable in transit.
  payload jsonb not null,
  -- The answer that defines "solved", used to check submitted results. Never sent to players.
  solution jsonb not null,
  memory jsonb,
  hints jsonb,
  answers text[] not null default '{}',
  status public.puzzle_status not null default 'generated',
  review_note text,
  validator_version text,
  version integer not null default 1,
  content_hash text not null unique,
  generation_run uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index puzzles_format_status on public.puzzles (format_id, status);

-- Every check the gate ran, with the validator version and the reason, so decisions can be audited.
create table public.puzzle_checks (
  id bigint generated always as identity primary key,
  puzzle_id uuid not null references public.puzzles (id) on delete cascade,
  check_name text not null,
  passed boolean not null,
  details jsonb not null default '{}',
  validator_version text not null,
  checked_at timestamptz not null default now()
);

create table public.puzzle_status_log (
  id bigint generated always as identity primary key,
  puzzle_id uuid not null references public.puzzles (id) on delete cascade,
  from_status public.puzzle_status,
  to_status public.puzzle_status not null,
  reason text,
  actor text not null default current_user,
  changed_at timestamptz not null default now()
);

-- Status changes must follow the workflow; anything else is refused by the database itself.
create or replace function public.check_puzzle_status() returns trigger
language plpgsql as $$
declare
  ok boolean;
begin
  if tg_op = 'INSERT' then
    if new.status not in ('generated', 'screening') then
      raise exception 'New puzzles start as generated or screening, not %', new.status;
    end if;
    return new;
  end if;
  new.updated_at := now();
  if new.status = old.status then
    -- Approved content can't be quietly edited: a change sends it back through the gate.
    if (new.payload is distinct from old.payload or new.solution is distinct from old.solution or new.memory is distinct from old.memory)
       and old.status in ('approved', 'scheduled', 'published') then
      raise exception 'Edit puzzle % by sending it back to screening first', old.id;
    end if;
    return new;
  end if;
  ok := case old.status
    when 'generated' then new.status in ('screening')
    when 'screening' then new.status in ('rejected', 'needs_review', 'approved')
    when 'needs_review' then new.status in ('approved', 'rejected')
    when 'approved' then new.status in ('scheduled', 'quarantined')
    when 'scheduled' then new.status in ('published', 'approved', 'quarantined')
    when 'published' then new.status in ('quarantined')
    when 'quarantined' then new.status in ('screening', 'rejected')
    else false
  end;
  if not ok then
    raise exception 'A puzzle can''t go from % to %', old.status, new.status;
  end if;
  return new;
end $$;

create trigger puzzles_status before insert or update on public.puzzles
for each row execute function public.check_puzzle_status();

-- Logged after the change is saved. A reason can be passed with: set local then_again.reason = '...'.
create or replace function public.log_puzzle_status() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.puzzle_status_log (puzzle_id, from_status, to_status, reason)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status,
            coalesce(nullif(current_setting('then_again.reason', true), ''), case when tg_op = 'INSERT' then 'created' end));
  end if;
  return null;
end $$;

create trigger puzzles_status_log after insert or update of status on public.puzzles
for each row execute function public.log_puzzle_status();

-- One set per date. Everyone on the same date gets the same set.
create table public.daily_sets (
  date date primary key,
  theme_id text references public.themes (id),
  puzzle_ids uuid[] not null check (cardinality(puzzle_ids) between 1 and 6),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Only approved puzzles can be scheduled, and scheduling marks them.
create or replace function public.check_daily_set() returns trigger
language plpgsql as $$
declare
  bad uuid;
begin
  select p into bad from unnest(new.puzzle_ids) as p
  where not exists (select 1 from public.puzzles z where z.id = p and z.status in ('approved', 'scheduled', 'published'))
  limit 1;
  if bad is not null then
    raise exception 'Puzzle % is not approved, so it can''t be scheduled', bad;
  end if;
  update public.puzzles set status = 'scheduled' where id = any (new.puzzle_ids) and status = 'approved';
  return new;
end $$;

create trigger daily_sets_check before insert or update of puzzle_ids on public.daily_sets
for each row execute function public.check_daily_set();

-- The earliest time zone (UTC+14) reaches a date a day before UTC, so sets go live a day early on the
-- server; the app still only shows a set on the player's own date.
create or replace function public.publish_due_sets() returns integer
language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  with due as (
    update public.daily_sets set published = true
    where not published and date <= (now() at time zone 'utc')::date + 1
    returning puzzle_ids
  )
  update public.puzzles set status = 'published'
  where id in (select unnest(puzzle_ids) from due) and status = 'scheduled';
  get diagnostics n = row_count;
  return n;
end $$;

-- What the app reads: one published set by date, never a future one, never the solutions.
create or replace function public.get_daily_set(p_date date) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'date', s.date,
    'theme', to_jsonb(t) - 'created_at',
    'puzzles', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'formatId', p.format_id, 'difficulty', p.difficulty, 'payload', p.payload, 'memory', p.memory) order by k.ord)
      from unnest(s.puzzle_ids) with ordinality as k (id, ord)
      join public.puzzles p on p.id = k.id and p.status = 'published'
    ), '[]'::jsonb)
  )
  from public.daily_sets s
  left join public.themes t on t.id = s.theme_id
  where s.date = p_date and s.published and p_date <= (now() at time zone 'utc')::date + 1;
$$;

create table public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  batch text not null,
  format_id text not null,
  requested integer not null,
  generated integer not null default 0,
  approved integer not null default 0,
  rejected integer not null default 0,
  needs_review integer not null default 0,
  failures jsonb not null default '[]',
  ai_cost_cents integer not null default 0,
  review_status text not null default 'open',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.alerts (
  id bigint generated always as identity primary key,
  kind text not null,
  message text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Validated reserve per format: approved puzzles not yet scheduled.
create or replace view public.reserve_by_format with (security_invoker = true) as
  select format_id, count(*) filter (where status = 'approved') as approved_unscheduled,
         count(*) filter (where status = 'needs_review') as waiting_for_review,
         count(*) filter (where status = 'scheduled') as scheduled
  from public.puzzles group by format_id;

-- Days ahead that have a set ready. The brief asks for at least 30 at all times.
create or replace function public.scheduled_days_ahead() returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.daily_sets where date > (now() at time zone 'utc')::date;
$$;

-- Raises an alert when the validated runway drops under 30 days. Run daily by the scheduler.
create or replace function public.check_runway() returns void
language plpgsql security definer set search_path = public as $$
declare
  days integer := public.scheduled_days_ahead();
begin
  if days < 30 and not exists (select 1 from public.alerts where kind = 'runway' and resolved_at is null) then
    insert into public.alerts (kind, message, details)
    values ('runway', format('Only %s days of daily sets are scheduled; the minimum is 30.', days), jsonb_build_object('days', days));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Players (optional accounts come later; these stay empty until then)
-- ---------------------------------------------------------------------------
create table public.player_progress (
  player uuid not null,
  puzzle_id uuid not null references public.puzzles (id),
  date date not null,
  attempt text not null check (attempt in ('first', 'retry')),
  solved boolean not null,
  score text not null,
  time_ms integer,
  completed_at timestamptz not null default now(),
  primary key (player, puzzle_id, attempt)
);

create table public.wallet (
  player uuid primary key,
  balance integer not null default 0 check (balance >= 0)
);

create table public.gem_transactions (
  id bigint generated always as identity primary key,
  player uuid not null,
  delta integer not null,
  kind text not null check (kind in ('earned', 'spent', 'purchased', 'refund')),
  reason text not null,
  -- The same reward can't be paid twice: each payout carries a unique key.
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table public.rewards (
  player uuid primary key,
  streak integer not null default 0,
  best_streak integer not null default 0,
  shields integer not null default 0,
  last_played date,
  badges jsonb not null default '{}',
  cabinet text[] not null default '{}',
  envelopes integer not null default 0
);

create table public.notification_prefs (
  player uuid primary key,
  daily boolean not null default false,
  streak boolean not null default false,
  rewards boolean not null default false,
  remind_at time not null default '09:00',
  time_zone text not null default 'UTC',
  quiet_start time not null default '22:00',
  quiet_end time not null default '08:00',
  push_token text
);

-- ---------------------------------------------------------------------------
-- Launch tooling: remote switches, error reports, anonymous analytics, feedback
-- ---------------------------------------------------------------------------

-- Remote switches the app reads at launch. Rows with public = true are visible to everyone.
create table public.app_config (
  key text primary key,
  value jsonb not null,
  public boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value) values
  ('min_version', '"0.1.0"'),
  ('latest_version', '"0.1.0"'),
  ('monetisation_enabled', 'false'),
  ('gems_enabled', 'false'),
  ('paused_formats', '[]'),
  ('banner', 'null');

-- Crash and error reports from the app. No personal data: message, stack, screen and app version only.
create table public.client_errors (
  id bigint generated always as identity primary key,
  message text not null check (length(message) <= 1000),
  stack text check (length(stack) <= 8000),
  route text check (length(route) <= 200),
  app_version text not null check (length(app_version) <= 40),
  platform text not null check (length(platform) <= 40),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);

-- Anonymous usage events. No user or device ID: retention is counted from the player's own
-- cohort date and day number, which the app sends with each daily visit.
create table public.analytics_events (
  id bigint generated always as identity primary key,
  name text not null check (name in ('first_open', 'daily_visit', 'puzzle_complete', 'set_complete', 'reminder_choice', 'visit_end')),
  props jsonb not null default '{}' check (pg_column_size(props) <= 2000),
  app_version text not null check (length(app_version) <= 40),
  platform text not null check (length(platform) <= 40),
  local_date date not null,
  received_at timestamptz not null default now()
);

create table public.feedback (
  id bigint generated always as identity primary key,
  message text not null check (length(message) between 1 and 4000),
  reply_to text check (length(reply_to) <= 200),
  kind text not null default 'general' check (kind in ('general', 'bug', 'puzzle', 'idea')),
  route text check (length(route) <= 200),
  app_version text not null check (length(app_version) <= 40),
  platform text not null check (length(platform) <= 40),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

-- Day-7 return for each cohort: share of first opens on a date that came back on day 7.
create or replace view public.retention_day7 with (security_invoker = true) as
  select (props ->> 'cohort')::date as cohort,
         count(*) filter (where name = 'first_open') as first_opens,
         count(*) filter (where name = 'daily_visit' and (props ->> 'day')::int = 7) as back_on_day7
  from public.analytics_events
  where props ? 'cohort'
  group by 1;

-- ---------------------------------------------------------------------------
-- Row-level security: players can only add reports; admins see content and reports.
-- The service role (scheduled jobs, generators) bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.themes enable row level security;
alter table public.puzzles enable row level security;
alter table public.puzzle_checks enable row level security;
alter table public.puzzle_status_log enable row level security;
alter table public.daily_sets enable row level security;
alter table public.generation_runs enable row level security;
alter table public.alerts enable row level security;
alter table public.player_progress enable row level security;
alter table public.wallet enable row level security;
alter table public.gem_transactions enable row level security;
alter table public.rewards enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.app_config enable row level security;
alter table public.client_errors enable row level security;
alter table public.analytics_events enable row level security;
alter table public.feedback enable row level security;

create policy "themes are public" on public.themes for select using (true);
create policy "public switches are public" on public.app_config for select using (public);

create policy "anyone can report an error" on public.client_errors for insert to anon, authenticated with check (true);
create policy "anyone can send usage events" on public.analytics_events for insert to anon, authenticated with check (true);
create policy "anyone can send feedback" on public.feedback for insert to anon, authenticated with check (handled_at is null);

create policy "admins read admins" on public.admins for select to authenticated using (public.is_admin());
create policy "admins manage puzzles" on public.puzzles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins read checks" on public.puzzle_checks for select to authenticated using (public.is_admin());
create policy "admins read status log" on public.puzzle_status_log for select to authenticated using (public.is_admin());
create policy "admins manage sets" on public.daily_sets for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins read runs" on public.generation_runs for select to authenticated using (public.is_admin());
create policy "admins manage alerts" on public.alerts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage switches" on public.app_config for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins read errors" on public.client_errors for select to authenticated using (public.is_admin());
create policy "admins read events" on public.analytics_events for select to authenticated using (public.is_admin());
create policy "admins manage feedback" on public.feedback for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "players see their own progress" on public.player_progress for select to authenticated using (player = auth.uid());
create policy "players see their own wallet" on public.wallet for select to authenticated using (player = auth.uid());
create policy "players see their own ledger" on public.gem_transactions for select to authenticated using (player = auth.uid());
create policy "players see their own rewards" on public.rewards for select to authenticated using (player = auth.uid());
create policy "players manage their reminders" on public.notification_prefs for all to authenticated using (player = auth.uid()) with check (player = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.themes, public.app_config to anon, authenticated;
grant insert on public.client_errors, public.analytics_events, public.feedback to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.get_daily_set(date) to anon, authenticated;
revoke execute on function public.publish_due_sets() from public, anon, authenticated;
revoke execute on function public.check_runway() from public, anon, authenticated;

-- Scheduled jobs: publish due sets and check the runway every hour (needs the pg_cron extension,
-- which Supabase provides; enable it under Database > Extensions).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('publish-due-sets', '5 * * * *', 'select public.publish_due_sets()');
    perform cron.schedule('check-runway', '15 6 * * *', 'select public.check_runway()');
  end if;
end $$;
