-- Then Again Plus: five games free, the rest with a $0.99 monthly subscription.
-- monetisation_enabled now means "lock games outside the free list"; free_formats lists the free ones
-- (empty means the list built into the app). Both can be changed from the admin pages.
update public.app_config set value = 'true', updated_at = now() where key = 'monetisation_enabled';
insert into public.app_config (key, value) values ('free_formats', '[]') on conflict (key) do nothing;

alter table public.analytics_events drop constraint analytics_events_name_check;
alter table public.analytics_events add constraint analytics_events_name_check check (name in (
  'first_open', 'daily_visit', 'puzzle_complete', 'set_complete', 'link_result', 'story_saved',
  'region_choice', 'paywall_view', 'plus_start', 'reminder_choice', 'visit_end'));

-- Paywall views and Plus starts join the pilot numbers.
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
    'errors_7d', (select count(*) from client_errors where received_at > now() - interval '7 days'),
    'paywall_views', (select count(*) from analytics_events where name = 'paywall_view' and local_date >= since),
    'plus_starts', (select count(*) from analytics_events where name = 'plus_start' and local_date >= since));
end $$;
