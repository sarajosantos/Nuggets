-- Plotwick — Supabase schema.
-- Paste this into the Supabase SQL editor (or run via `supabase db push`).
-- Safe to re-run: everything is idempotent.

-- ---------------------------------------------------------------------------
-- Stories (per-user saved games)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Shared (published) stories: world-readable, written only by the server.
-- ---------------------------------------------------------------------------

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
-- No insert/update/delete policies: only the service-role key (which bypasses
-- RLS) can write, i.e. the Plotwick server.

-- ---------------------------------------------------------------------------
-- Profiles & story credits
-- ---------------------------------------------------------------------------
-- One row per user, holding their story-credit balance. A new signup starts
-- with a few free credits so people can try before buying.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  credits integer not null default 3 check (credits >= 0),  -- FREE TRIAL CREDITS (tune this)
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users may READ their own balance. They may NOT write it — only the server
-- (via SECURITY DEFINER functions below) changes credits.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select
  using (auth.uid() = id);

-- Auto-create a profile (with free credits) the moment a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Story-start charge ledger (anti-double-charge / idempotency)
-- ---------------------------------------------------------------------------
-- One row per story that has been charged. The first time the server generates
-- for a given story id, it inserts here and deducts a credit; later chapters of
-- the same story find the row already present and are free.

create table if not exists public.story_starts (
  story_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  charged_at timestamptz not null default now()
);

alter table public.story_starts enable row level security;
-- No policies: server-only (service role) access.

-- Atomically "begin" a story: if this story id hasn't been charged yet, verify
-- the user has a credit, deduct one, and record the charge — all in one shot.
-- Returns the new balance and whether a credit was charged on this call.
-- Called only by the server via the service-role key.
create or replace function public.start_story(p_user_id uuid, p_story_id text)
returns table (ok boolean, charged boolean, credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_row integer;
  v_credits integer;
begin
  -- Reserve the story id. If it already existed, this is a continuation.
  insert into public.story_starts (story_id, user_id)
  values (p_story_id, p_user_id)
  on conflict (story_id) do nothing;
  get diagnostics v_new_row = row_count;  -- 1 = we inserted, 0 = already charged

  if v_new_row = 0 then
    -- Legacy compatibility only: never let another user continue this id.
    if not exists (
      select 1 from public.story_starts
      where story_id = p_story_id and user_id = p_user_id
    ) then
      return query select false, false, 0;
      return;
    end if;
    select credits into v_credits from public.profiles where id = p_user_id;
    return query select true, false, coalesce(v_credits, 0);
    return;
  end if;

  -- New story: attempt to deduct one credit, locking the profile row.
  update public.profiles
    set credits = credits - 1
    where id = p_user_id and credits > 0
    returning credits into v_credits;

  if not found then
    -- No credits: undo the reservation so they can start once they top up.
    delete from public.story_starts where story_id = p_story_id;
    return query select false, false, 0;
    return;
  end if;

  return query select true, true, v_credits;
end;
$$;

-- Undo a charge (used if the very first chapter fails to generate). Removes the
-- ledger row and refunds the credit so the user can retry cleanly.
create or replace function public.refund_story(p_user_id uuid, p_story_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.story_starts
             where story_id = p_story_id and user_id = p_user_id) then
    delete from public.story_starts where story_id = p_story_id;
    update public.profiles set credits = credits + 1 where id = p_user_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Stripe payments: idempotent credit grants
-- ---------------------------------------------------------------------------
-- Every processed Stripe event is recorded here so replays/retries never
-- double-grant credits.

create table if not exists public.stripe_events (
  id text primary key,               -- Stripe event id (evt_...)
  user_id uuid references auth.users (id) on delete set null,
  credits_granted integer not null,
  created_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- Server-only (service role) access; no policies.

-- Grant credits for a paid Stripe event, exactly once. If the event id was
-- already processed, this is a no-op. Returns the new balance.
create or replace function public.grant_stripe_credits(
  p_event_id text, p_user_id uuid, p_credits integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_event integer;
  v_credits integer;
begin
  insert into public.stripe_events (id, user_id, credits_granted)
  values (p_event_id, p_user_id, p_credits)
  on conflict (id) do nothing;
  get diagnostics v_new_event = row_count;

  if v_new_event = 0 then
    -- Already processed this event; return current balance unchanged.
    select credits into v_credits from public.profiles where id = p_user_id;
    return coalesce(v_credits, 0);
  end if;

  insert into public.profiles (id, credits) values (p_user_id, p_credits)
  on conflict (id) do update set credits = public.profiles.credits + p_credits
  returning credits into v_credits;

  return v_credits;
end;
$$;

-- Lock all three money functions down: they run as SECURITY DEFINER, so make
-- sure end users (anon / authenticated) can NEVER call them directly. Only the
-- server's service-role key (which bypasses these grants) may invoke them.
revoke all on function public.start_story(uuid, text) from public, anon, authenticated;
revoke all on function public.refund_story(uuid, text) from public, anon, authenticated;
revoke all on function public.grant_stripe_credits(text, uuid, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Authoritative story sessions
-- ---------------------------------------------------------------------------
-- The browser still carries full story history for generation, but it may not
-- invent continuations. The server stores only integrity metadata: owner,
-- immutable scenario/character hashes, and a rolling hash of completed history.

create table if not exists public.story_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_hash text not null,
  character_hash text not null,
  history_hash text,
  chapter_count integer not null default 0 check (chapter_count >= 0),
  status text not null default 'generating' check (status in ('ready', 'generating')),
  active_request_id uuid,
  charged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.story_sessions enable row level security;
create index if not exists story_sessions_user_idx
  on public.story_sessions (user_id, updated_at desc);

create or replace function public.begin_story_session(
  p_user_id uuid,
  p_story_id uuid,
  p_scenario_hash text,
  p_character_hash text,
  p_request_id uuid,
  p_charge boolean
)
returns table (ok boolean, charged boolean, credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits integer;
begin
  if p_charge then
    update public.profiles
      set credits = credits - 1
      where id = p_user_id and credits > 0
      returning profiles.credits into v_credits;
    if not found then
      return query select false, false, 0;
      return;
    end if;
  else
    select profiles.credits into v_credits
      from public.profiles where id = p_user_id;
  end if;

  insert into public.story_sessions (
    id, user_id, scenario_hash, character_hash, status,
    active_request_id, charged
  ) values (
    p_story_id, p_user_id, p_scenario_hash, p_character_hash, 'generating',
    p_request_id, p_charge
  );

  if p_charge then
    insert into public.story_starts (story_id, user_id)
      values (p_story_id::text, p_user_id);
  end if;
  return query select true, p_charge, coalesce(v_credits, 0);
end;
$$;

create or replace function public.claim_story_chapter(
  p_user_id uuid,
  p_story_id uuid,
  p_scenario_hash text,
  p_character_hash text,
  p_prior_history_hash text,
  p_request_id uuid
)
returns table (ok boolean, conflict boolean, credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits integer;
begin
  select profiles.credits into v_credits
    from public.profiles where id = p_user_id;

  update public.story_sessions
    set status = 'generating',
        active_request_id = p_request_id,
        updated_at = now()
    where id = p_story_id
      and user_id = p_user_id
      and scenario_hash = p_scenario_hash
      and character_hash = p_character_hash
      and history_hash = p_prior_history_hash
      and (
        status = 'ready'
        or (status = 'generating' and updated_at < now() - interval '5 minutes')
      );
  if found then
    return query select true, false, coalesce(v_credits, 0);
  else
    return query select false, true, coalesce(v_credits, 0);
  end if;
end;
$$;

create or replace function public.complete_story_chapter(
  p_user_id uuid,
  p_story_id uuid,
  p_request_id uuid,
  p_history_hash text,
  p_chapter_count integer
)
returns table (ok boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.story_sessions
    set history_hash = p_history_hash,
        chapter_count = p_chapter_count,
        status = 'ready',
        active_request_id = null,
        updated_at = now()
    where id = p_story_id
      and user_id = p_user_id
      and status = 'generating'
      and active_request_id = p_request_id
      and p_chapter_count = chapter_count + 1;
  return query select found;
end;
$$;

create or replace function public.fail_story_chapter(
  p_user_id uuid,
  p_story_id uuid,
  p_request_id uuid
)
returns table (reset boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.story_sessions%rowtype;
  v_deleted integer;
begin
  select * into v_session
    from public.story_sessions
    where id = p_story_id
      and user_id = p_user_id
      and active_request_id = p_request_id
    for update;
  if not found then
    return query select false;
    return;
  end if;

  if v_session.chapter_count = 0 then
    delete from public.story_sessions where id = p_story_id;
    if v_session.charged then
      delete from public.story_starts
        where story_id = p_story_id::text and user_id = p_user_id;
      get diagnostics v_deleted = row_count;
      if v_deleted = 1 then
        update public.profiles set credits = credits + 1 where id = p_user_id;
      end if;
    end if;
    return query select true;
  else
    update public.story_sessions
      set status = 'ready', active_request_id = null, updated_at = now()
      where id = p_story_id;
    return query select false;
  end if;
end;
$$;

revoke all on function public.begin_story_session(uuid, uuid, text, text, uuid, boolean)
  from public, anon, authenticated;
revoke all on function public.claim_story_chapter(uuid, uuid, text, text, text, uuid)
  from public, anon, authenticated;
revoke all on function public.complete_story_chapter(uuid, uuid, uuid, text, integer)
  from public, anon, authenticated;
revoke all on function public.fail_story_chapter(uuid, uuid, uuid)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Distributed rate limits and operational usage
-- ---------------------------------------------------------------------------

create table if not exists public.rate_limit_buckets (
  key text not null,
  bucket bigint not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (key, bucket)
);
alter table public.rate_limit_buckets enable row level security;

create or replace function public.consume_rate_limit(
  p_key text, p_limit integer, p_window_seconds integer
)
returns table (allowed boolean, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket bigint;
  v_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    return query select false, 0;
    return;
  end if;
  v_bucket := floor(extract(epoch from now()) / p_window_seconds);
  insert into public.rate_limit_buckets (key, bucket, count)
    values (p_key, v_bucket, 1)
    on conflict (key, bucket)
    do update set count = public.rate_limit_buckets.count + 1, updated_at = now()
    returning count into v_count;
  return query select v_count <= p_limit, greatest(p_limit - v_count, 0);
end;
$$;
revoke all on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;

create table if not exists public.usage_events (
  id bigint generated by default as identity primary key,
  request_id text,
  user_id uuid references auth.users (id) on delete set null,
  story_id text,
  kind text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.usage_events enable row level security;
create index if not exists usage_events_created_idx on public.usage_events (created_at desc);
create index if not exists usage_events_user_idx on public.usage_events (user_id, created_at desc);

create table if not exists public.share_reports (
  id bigint generated by default as identity primary key,
  share_id text not null references public.shared_stories (id) on delete cascade,
  reason text not null,
  reporter_hash text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
alter table public.share_reports enable row level security;
create index if not exists share_reports_status_idx on public.share_reports (status, created_at desc);

-- Store enough purchase context to reconcile paid sessions from Stripe.
alter table public.stripe_events add column if not exists session_id text;
alter table public.stripe_events add column if not exists pack_id text;

create or replace function public.grant_stripe_credits(
  p_event_id text,
  p_user_id uuid,
  p_credits integer,
  p_session_id text,
  p_pack_id text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_event integer;
  v_credits integer;
begin
  if p_credits <= 0 then raise exception 'invalid credit grant'; end if;
  insert into public.stripe_events (
    id, user_id, credits_granted, session_id, pack_id
  ) values (
    p_event_id, p_user_id, p_credits, p_session_id, p_pack_id
  ) on conflict (id) do nothing;
  get diagnostics v_new_event = row_count;
  if v_new_event = 0 then
    select profiles.credits into v_credits
      from public.profiles where id = p_user_id;
    return coalesce(v_credits, 0);
  end if;
  insert into public.profiles (id, credits) values (p_user_id, p_credits)
  on conflict (id) do update
    set credits = public.profiles.credits + p_credits
  returning profiles.credits into v_credits;
  return v_credits;
end;
$$;
revoke all on function public.grant_stripe_credits(text, uuid, integer, text, text)
  from public, anon, authenticated;
