-- CricketSim Supabase Schema
create extension if not exists pgcrypto;

create type public.app_role as enum ('ADMIN', 'MODERATOR', 'USER');
create type public.player_role as enum ('BAT', 'BOWL', 'AR', 'WK');
create type public.ranking_category as enum ('BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'TEAM');

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'User'),
    new.email,
    'USER'
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(public.users.name, excluded.name);
  return new;
end;
$$ language plpgsql security definer;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role public.app_role not null default 'USER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role public.player_role not null,
  image_url text,
  batting_stats_json jsonb not null default '{}'::jsonb,
  bowling_stats_json jsonb not null default '{}'::jsonb,
  fielding_stats_json jsonb not null default '{}'::jsonb,
  career_stats_json jsonb not null default '{}'::jsonb,
  recent_form_json jsonb not null default '[]'::jsonb,
  consistency_score numeric not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  squad_player_ids uuid[] not null default '{}',
  approved boolean not null default false,
  owner_user_id uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id bigserial primary key,
  external_ref text unique,
  team_a text not null,
  team_b text not null,
  result text,
  scorecard_json jsonb not null default '{}'::jsonb,
  commentary_json jsonb not null default '[]'::jsonb,
  pitch_type text,
  weather text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  format text not null,
  teams uuid[] not null default '{}',
  standings_json jsonb not null default '[]'::jsonb,
  schedule_json jsonb not null default '[]'::jsonb,
  bracket_json jsonb,
  results_timeline_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('tournament', 'series', 'league')),
  format text not null default 'T20',
  team_ids uuid[] not null default '{}',
  fixtures_json jsonb not null default '[]'::jsonb,
  schedule_json jsonb not null default '[]'::jsonb,
  standings_json jsonb not null default '[]'::jsonb,
  bracket_json jsonb,
  stats_json jsonb not null default '{}'::jsonb,
  current_round int not null default 1,
  winner uuid references public.teams(id),
  status text not null default 'scheduled',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.competitions
  add column if not exists fixtures_json jsonb not null default '[]'::jsonb,
  add column if not exists bracket_json jsonb,
  add column if not exists stats_json jsonb not null default '{}'::jsonb,
  add column if not exists current_round int not null default 1,
  add column if not exists winner uuid references public.teams(id),
  add column if not exists status text not null default 'scheduled',
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'competitions_type_check'
      and conrelid = 'public.competitions'::regclass
  ) then
    alter table public.competitions drop constraint competitions_type_check;
  end if;

  alter table public.competitions
    add constraint competitions_type_check check (type in ('tournament', 'series', 'league'));
end $$;

create table if not exists public.rankings (
  id bigserial primary key,
  category public.ranking_category not null,
  player_id uuid references public.players(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  points numeric not null default 0,
  updated_at timestamptz not null default now(),
  constraint rankings_player_or_team check (
    (player_id is not null and team_id is null) or
    (player_id is null and team_id is not null)
  )
);

create unique index if not exists rankings_unique_player on public.rankings(category, player_id) where player_id is not null;
create unique index if not exists rankings_unique_team on public.rankings(category, team_id) where team_id is not null;
create index if not exists rankings_points_idx on public.rankings(points desc);

create trigger users_updated_at before update on public.users for each row execute function public.handle_updated_at();
create trigger players_updated_at before update on public.players for each row execute function public.handle_updated_at();
create trigger teams_updated_at before update on public.teams for each row execute function public.handle_updated_at();
create trigger matches_updated_at before update on public.matches for each row execute function public.handle_updated_at();
create trigger tournaments_updated_at before update on public.tournaments for each row execute function public.handle_updated_at();
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'competitions_updated_at'
  ) then
    create trigger competitions_updated_at
      before update on public.competitions
      for each row execute function public.handle_updated_at();
  end if;
end $$;
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_auth_user();
  end if;
end $$;

alter table public.users enable row level security;
alter table public.players enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.tournaments enable row level security;
alter table public.rankings enable row level security;
alter table public.competitions enable row level security;

create policy "Users can read self profile" on public.users for select using (id = auth.uid());
create policy "Users can update self profile" on public.users for update using (id = auth.uid());

create policy "Public read players" on public.players for select using (true);
create policy "Public read teams" on public.teams for select using (true);
create policy "Public read matches" on public.matches for select using (true);
create policy "Public read tournaments" on public.tournaments for select using (true);
create policy "Public read rankings" on public.rankings for select using (true);
create policy "Public read competitions" on public.competitions for select using (true);

create policy "Admin manage players" on public.players for all using (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role in ('ADMIN', 'MODERATOR'))
);

create policy "Admin manage tournaments" on public.tournaments for all using (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role in ('ADMIN', 'MODERATOR'))
);

create policy "User create teams" on public.teams for insert with check (auth.uid() is not null);
create policy "Team owner update" on public.teams for update using (
  owner_user_id = auth.uid() or exists(select 1 from public.users u where u.id = auth.uid() and u.role in ('ADMIN', 'MODERATOR'))
);

create policy "Admin manage matches" on public.matches for all using (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role in ('ADMIN', 'MODERATOR'))
);

create policy "Admin manage rankings" on public.rankings for all using (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role in ('ADMIN', 'MODERATOR'))
);

create policy "Admin insert competitions" on public.competitions for insert with check (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
);

create policy "Admin update competitions" on public.competitions for update using (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
);

create policy "Admin delete competitions" on public.competitions for delete using (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
);

-- Storage bucket and policies for player images
insert into storage.buckets (id, name, public)
values ('player-images', 'player-images', true)
on conflict (id) do nothing;

create policy "Public read images" on storage.objects for select using (bucket_id = 'player-images');
create policy "Admin upload images" on storage.objects for insert with check (
  bucket_id = 'player-images' and auth.uid() is not null
);

-- Realtime (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'players'
  ) then
    alter publication supabase_realtime add table public.players;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'teams'
  ) then
    alter publication supabase_realtime add table public.teams;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'rankings'
  ) then
    alter publication supabase_realtime add table public.rankings;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and n.nspname = 'public'
      and c.relname = 'competitions'
  ) then
    alter publication supabase_realtime add table public.competitions;
  end if;
end $$;
