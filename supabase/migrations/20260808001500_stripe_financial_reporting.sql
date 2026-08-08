-- Keep the Publisher's Ledger honest after refunds and Stripe fees.
-- Nullable means the webhook fulfilled correctly but Stripe's balance
-- transaction was not available yet; replaying the signed event backfills it.
alter table public.stripe_events
  add column if not exists stripe_fee integer,
  add column if not exists stripe_net integer;

alter table public.stripe_refunds
  add column if not exists stripe_fee integer,
  add column if not exists stripe_net integer;

-- Small, privacy-minimized reader-pilot responses. The actor key uses the
-- same salted identifier as product events; story prose is never copied here.
create table if not exists public.pilot_feedback (
  id uuid primary key,
  cohort text not null check (cohort ~ '^[a-zA-Z0-9:_-]{1,80}$'),
  actor_key text not null,
  user_id uuid references auth.users (id) on delete set null,
  story_id text,
  completion_state text not null check (
    completion_state in ('first_chapter', 'in_progress', 'finished', 'abandoned')
  ),
  rating integer not null check (rating between 1 and 5),
  would_pay boolean,
  feedback text not null check (char_length(feedback) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.pilot_feedback enable row level security;
create index if not exists pilot_feedback_cohort_idx
  on public.pilot_feedback (cohort, created_at desc);
