begin;

create table public.portfolio_owners (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade
);

create table public.portfolio_settings (
  id smallint primary key default 1 check (id = 1),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  revision integer not null default 1 check (revision > 0)
);
insert into public.portfolio_settings (id) values (1);

create table public.portfolio_media (
  id uuid primary key default gen_random_uuid(),
  cloud text not null check (cloud ~ '^[a-zA-Z0-9_-]+$'),
  public_id text not null unique check (public_id ~ '^portfolio/[0-9a-f-]{36}$'),
  type text not null check (type in ('image', 'video')),
  alt text not null check (char_length(alt) between 1 and 220),
  caption text not null default '' check (char_length(caption) <= 350),
  created_at timestamptz not null default now()
);

create table public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  working jsonb not null check (jsonb_typeof(working) = 'object' and coalesce(working ->> 'service', '') in ('graphic-design', 'video-editing', 'ui-ux', 'development')),
  live jsonb,
  state text not null default 'draft' check (state in ('draft', 'published', 'archived')),
  revision integer not null default 1 check (revision > 0),
  working_edit boolean not null default false,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  check (
    (state = 'published' and live is not null and jsonb_typeof(live) = 'object' and published_at is not null)
    or (state <> 'published' and live is null and published_at is null)
  )
);
create index portfolio_projects_recent on public.portfolio_projects (updated_at desc);
create index portfolio_projects_public on public.portfolio_projects (slug) where state = 'published';

create table public.portfolio_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 3 and 254),
  services text[] not null check (cardinality(services) between 1 and 4 and services <@ array['graphic-design', 'video-editing', 'ui-ux', 'development', 'general']),
  budget text not null default '' check (char_length(budget) <= 100),
  message text not null check (char_length(message) between 10 and 3000),
  notification text not null default 'pending' check (notification in ('pending', 'not_configured', 'failed', 'sent')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index portfolio_enquiries_recent on public.portfolio_enquiries (created_at desc);

create table public.portfolio_rate_limits (
  bucket text not null,
  fingerprint text not null,
  window_start timestamptz not null,
  attempts integer not null check (attempts > 0),
  primary key (bucket, fingerprint)
);
create index portfolio_rate_limits_expiry on public.portfolio_rate_limits (window_start);

alter table public.portfolio_owners enable row level security;
alter table public.portfolio_settings enable row level security;
alter table public.portfolio_media enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_enquiries enable row level security;
alter table public.portfolio_rate_limits enable row level security;

revoke all on public.portfolio_owners, public.portfolio_settings, public.portfolio_media, public.portfolio_projects, public.portfolio_enquiries, public.portfolio_rate_limits from public, anon, authenticated;
grant select (id, content) on public.portfolio_settings to anon;
grant select, update on public.portfolio_settings to authenticated;
grant select, insert, update on public.portfolio_media to authenticated;
grant select, insert, update, delete on public.portfolio_projects to authenticated;
grant select, update (reviewed_at) on public.portfolio_enquiries to authenticated;
grant select, insert, update on public.portfolio_enquiries to service_role;

create function public.portfolio_is_owner()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.portfolio_owners where user_id = (select auth.uid()));
$$;
revoke all on function public.portfolio_is_owner() from public, anon, authenticated;
grant execute on function public.portfolio_is_owner() to authenticated;

create policy portfolio_settings_public on public.portfolio_settings for select to anon, authenticated using (true);
create policy portfolio_settings_owner on public.portfolio_settings for update to authenticated using ((select public.portfolio_is_owner())) with check ((select public.portfolio_is_owner()));
create policy portfolio_projects_read on public.portfolio_projects for select to authenticated using ((select public.portfolio_is_owner()));
create policy portfolio_projects_insert on public.portfolio_projects for insert to authenticated with check ((select public.portfolio_is_owner()));
create policy portfolio_projects_update on public.portfolio_projects for update to authenticated using ((select public.portfolio_is_owner())) with check ((select public.portfolio_is_owner()));
create policy portfolio_projects_delete on public.portfolio_projects for delete to authenticated using (state = 'archived' and (select public.portfolio_is_owner()));
create policy portfolio_media_owner on public.portfolio_media for all to authenticated using ((select public.portfolio_is_owner())) with check ((select public.portfolio_is_owner()));
create policy portfolio_enquiries_read on public.portfolio_enquiries for select to authenticated using ((select public.portfolio_is_owner()));
create policy portfolio_enquiries_review on public.portfolio_enquiries for update to authenticated using ((select public.portfolio_is_owner())) with check ((select public.portfolio_is_owner()));

create function public.portfolio_published(requested_slug text default null)
returns table (slug text, live jsonb)
language sql stable security definer set search_path = ''
as $$
  select project.slug, case when project.slug = requested_slug then project.live else project.live - 'sections' - 'links' end
  from public.portfolio_projects as project
  where project.state = 'published'
  order by coalesce((project.live ->> 'sort')::int, 0), project.slug;
$$;
revoke all on function public.portfolio_published(text) from public, anon, authenticated;
grant execute on function public.portfolio_published(text) to anon, authenticated;

create function public.portfolio_rate_allowed(bucket text, fingerprint text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  request_bucket alias for $1;
  request_key alias for $2;
  slot timestamptz := date_trunc('hour', statement_timestamp());
  ceiling integer;
  current_count integer;
begin
  ceiling := case request_bucket when 'contact' then 4 when 'login' then 8 end;
  if ceiling is null or request_key !~ '^[0-9a-f]{64}$' then return false; end if;
  insert into public.portfolio_rate_limits as limits (bucket, fingerprint, window_start, attempts)
  values (request_bucket, request_key, slot, 1)
  on conflict on constraint portfolio_rate_limits_pkey do update
    set window_start = excluded.window_start,
        attempts = case when limits.window_start = excluded.window_start then least(limits.attempts + 1, 1000) else 1 end
  returning attempts into current_count;
  return current_count <= ceiling;
end;
$$;
revoke all on function public.portfolio_rate_allowed(text, text) from public, anon, authenticated;
grant execute on function public.portfolio_rate_allowed(text, text) to service_role;

commit;
