-- Optional player accounts, and the records the admin pages manage.

-- ---------------------------------------------------------------------------
-- A signed-in player's saved progress: one row each, the same shape as the phone's own save
-- (results, settings, reminder choices). Saved memories stay on the phone.
-- ---------------------------------------------------------------------------
create table public.player_saves (
  player uuid primary key default auth.uid(),
  data jsonb not null check (pg_column_size(data) <= 1000000),
  updated_at timestamptz not null default now()
);
alter table public.player_saves enable row level security;
create policy "players manage their own save" on public.player_saves for all to authenticated
  using (player = auth.uid()) with check (player = auth.uid());
grant select, insert, update, delete on public.player_saves to authenticated;

-- Players can delete their account and everything stored with it, from inside the app.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  delete from public.player_saves where player = auth.uid();
  delete from public.notification_prefs where player = auth.uid();
  delete from public.rewards where player = auth.uid();
  delete from public.wallet where player = auth.uid();
  delete from public.admins where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Review decisions on scheduled puzzles, made in the admin pages.
-- ---------------------------------------------------------------------------
create table public.content_reviews (
  id bigint generated always as identity primary key,
  puzzle_id text not null check (length(puzzle_id) between 1 and 80),
  decision text not null check (decision in ('approved', 'changes')),
  note text not null default '' check (length(note) <= 2000),
  reviewer uuid not null default auth.uid(),
  decided_at timestamptz not null default now()
);
create index content_reviews_puzzle on public.content_reviews (puzzle_id, decided_at desc);
alter table public.content_reviews enable row level security;
create policy "admins manage reviews" on public.content_reviews for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.content_reviews to authenticated;

-- ---------------------------------------------------------------------------
-- Admin tools: find a player (for a data request), delete one, and pilot numbers.
-- ---------------------------------------------------------------------------
create or replace function public.admin_find_player(p_email text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare found jsonb;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select jsonb_build_object(
    'id', u.id, 'email', u.email, 'joined', u.created_at, 'last_sign_in', u.last_sign_in_at,
    'results', coalesce((select count(*) from jsonb_object_keys(s.data -> 'progress')), 0),
    'saved_at', s.updated_at)
  into found
  from auth.users u left join public.player_saves s on s.player = u.id
  where lower(u.email) = lower(trim(p_email));
  return found;
end $$;

create or replace function public.admin_delete_player(p_player uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  delete from public.player_saves where player = p_player;
  delete from public.notification_prefs where player = p_player;
  delete from public.rewards where player = p_player;
  delete from public.wallet where player = p_player;
  delete from auth.users where id = p_player;
end $$;

-- Pilot questions from the brief: how many start, how many come back on day 7, how much they play.
create or replace function public.admin_usage_summary(p_days integer default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare since date := current_date - p_days;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return jsonb_build_object(
    'days', p_days,
    'first_opens', (select count(*) from analytics_events where name = 'first_open' and local_date >= since),
    'visits', (select count(*) from analytics_events where name = 'daily_visit' and local_date >= since),
    'puzzles', (select count(*) from analytics_events where name = 'puzzle_complete' and local_date >= since),
    'full_days', (select count(*) from analytics_events where name = 'set_complete' and local_date >= since),
    'links_found', (select count(*) from analytics_events where name = 'link_result' and (props ->> 'solved')::boolean and local_date >= since),
    'links_tried', (select count(*) from analytics_events where name = 'link_result' and local_date >= since),
    'day7_returns', (select count(*) from analytics_events where name = 'daily_visit' and (props ->> 'day') = '7' and local_date >= since),
    'accounts', (select count(*) from auth.users),
    'feedback_open', (select count(*) from feedback where handled_at is null),
    'errors_7d', (select count(*) from client_errors where received_at > now() - interval '7 days'));
end $$;

revoke all on function public.admin_find_player(text), public.admin_delete_player(uuid), public.admin_usage_summary(integer) from public;
grant execute on function public.admin_find_player(text), public.admin_delete_player(uuid), public.admin_usage_summary(integer) to authenticated;
