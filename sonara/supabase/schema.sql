-- SONARA production-ish Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text default '',
  avatar_url text,
  is_artist boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  artist_name text not null,
  genre text,
  description text default '',
  audio_path text not null,
  cover_url text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  plays bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text default '',
  cover_url text,
  is_public boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists public.playlist_tracks (
  playlist_id uuid references public.playlists(id) on delete cascade,
  track_id uuid references public.tracks(id) on delete cascade,
  position integer not null default 0,
  primary key (playlist_id, track_id)
);

create table if not exists public.likes (
  user_id uuid references public.profiles(id) on delete cascade,
  track_id uuid references public.tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.play_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  track_id uuid references public.tracks(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists tracks_owner_idx on public.tracks(owner_id);
create index if not exists tracks_created_idx on public.tracks(created_at desc);
create index if not exists tracks_plays_idx on public.tracks(plays desc);
create index if not exists play_events_track_idx on public.play_events(track_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, username, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.play_events enable row level security;

drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles for select using (true);
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id);

drop policy if exists "public tracks read" on public.tracks;
create policy "public tracks read" on public.tracks for select using (visibility='public' or owner_id=auth.uid());
drop policy if exists "artists insert tracks" on public.tracks;
create policy "artists insert tracks" on public.tracks for insert with check (owner_id=auth.uid());
drop policy if exists "artists update tracks" on public.tracks;
create policy "artists update tracks" on public.tracks for update using (owner_id=auth.uid()) with check (owner_id=auth.uid());
drop policy if exists "artists delete tracks" on public.tracks;
create policy "artists delete tracks" on public.tracks for delete using (owner_id=auth.uid());

create policy "playlist read" on public.playlists for select using (is_public or owner_id=auth.uid());
create policy "playlist insert" on public.playlists for insert with check (owner_id=auth.uid());
create policy "playlist owner update" on public.playlists for update using (owner_id=auth.uid());
create policy "playlist owner delete" on public.playlists for delete using (owner_id=auth.uid());
create policy "playlist tracks read" on public.playlist_tracks for select using (exists(select 1 from public.playlists p where p.id=playlist_id and (p.is_public or p.owner_id=auth.uid())));
create policy "playlist tracks write" on public.playlist_tracks for all using (exists(select 1 from public.playlists p where p.id=playlist_id and p.owner_id=auth.uid())) with check (exists(select 1 from public.playlists p where p.id=playlist_id and p.owner_id=auth.uid()));

create policy "likes own" on public.likes for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "follows own" on public.follows for all using (follower_id=auth.uid()) with check (follower_id=auth.uid());
create policy "play events insert" on public.play_events for insert with check (user_id=auth.uid() or user_id is null);
create policy "play events own read" on public.play_events for select using (user_id=auth.uid());

insert into storage.buckets (id,name,public) values ('tracks','tracks',true) on conflict (id) do nothing;
insert into storage.buckets (id,name,public) values ('covers','covers',true) on conflict (id) do nothing;

create policy "tracks storage public read" on storage.objects for select using (bucket_id='tracks');
create policy "tracks storage auth upload" on storage.objects for insert to authenticated with check (bucket_id='tracks' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "tracks storage owner update" on storage.objects for update to authenticated using (bucket_id='tracks' and owner_id=auth.uid()) with check (bucket_id='tracks' and owner_id=auth.uid());
create policy "tracks storage owner delete" on storage.objects for delete to authenticated using (bucket_id='tracks' and owner_id=auth.uid());

create policy "covers storage public read" on storage.objects for select using (bucket_id='covers');
create policy "covers storage auth upload" on storage.objects for insert to authenticated with check (bucket_id='covers' and (storage.foldername(name))[1]=auth.uid()::text);
