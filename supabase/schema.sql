-- Nuggets Adventure — Supabase schema.
-- Paste this into the Supabase SQL editor (or run via `supabase db push`).

-- Each row is one story; the full story object (history, chapters, cover…)
-- lives in `data` as jsonb, mirroring the client's localStorage shape.
create table if not exists public.stories (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  title text,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stories enable row level security;

-- Users can only see and touch their own stories.
drop policy if exists "own stories" on public.stories;
create policy "own stories" on public.stories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists stories_user_idx on public.stories (user_id, updated_at desc);

-- Published (shared) stories: world-readable, written only by the server
-- via the service-role key.
create table if not exists public.shared_stories (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.shared_stories enable row level security;

drop policy if exists "anyone can read shares" on public.shared_stories;
create policy "anyone can read shares" on public.shared_stories
  for select
  using (true);
-- No insert/update/delete policies: only the service-role key (which
-- bypasses RLS) can write, i.e. the Nuggets server.
