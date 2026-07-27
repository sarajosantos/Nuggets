-- Reconcile full Stripe refunds with the immutable novella-credit ledger.
alter table public.stripe_events add column if not exists payment_intent text;
alter table public.stripe_events add column if not exists refunded_at timestamptz;
create unique index if not exists stripe_events_payment_intent_idx
  on public.stripe_events (payment_intent)
  where payment_intent is not null;

alter table public.credit_ledger
  drop constraint if exists credit_ledger_reason_check;
alter table public.credit_ledger
  add constraint credit_ledger_reason_check check (
    reason in (
      'opening_balance',
      'welcome_novella',
      'stripe_purchase',
      'stripe_refund',
      'story_start',
      'story_refund',
      'admin_adjustment'
    )
  );

create table if not exists public.stripe_refunds (
  id text primary key,
  payment_intent text not null,
  purchase_event_id text references public.stripe_events (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  amount_refunded integer not null check (amount_refunded > 0),
  currency text not null,
  credits_revoked integer not null default 0 check (credits_revoked >= 0),
  created_at timestamptz not null default now()
);
alter table public.stripe_refunds enable row level security;
create index if not exists stripe_refunds_payment_intent_idx
  on public.stripe_refunds (payment_intent, created_at desc);

create or replace function public.grant_stripe_credits(
  p_event_id text,
  p_user_id uuid,
  p_credits integer,
  p_session_id text,
  p_pack_id text,
  p_payment_intent text,
  p_amount_total integer,
  p_currency text
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
  if p_amount_total <= 0 then raise exception 'invalid purchase amount'; end if;
  perform public.assert_credit_ledger_balance(p_user_id);
  insert into public.stripe_events (
    id, user_id, credits_granted, session_id, pack_id, payment_intent,
    amount_total, currency
  ) values (
    p_event_id, p_user_id, p_credits, p_session_id, p_pack_id, p_payment_intent,
    p_amount_total, lower(p_currency)
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
  insert into public.credit_ledger (
    user_id, delta, balance_after, reason, idempotency_key,
    stripe_event_id, metadata
  ) values (
    p_user_id,
    p_credits,
    v_credits,
    'stripe_purchase',
    'stripe:' || p_event_id,
    p_event_id,
    jsonb_build_object(
      'session_id', p_session_id,
      'pack_id', p_pack_id,
      'payment_intent', p_payment_intent,
      'amount_total', p_amount_total,
      'currency', lower(p_currency)
    )
  );
  return v_credits;
end;
$$;
revoke all on function public.grant_stripe_credits(
  text, uuid, integer, text, text, text, integer, text
)
  from public, anon, authenticated;

create or replace function public.refund_stripe_credits(
  p_event_id text,
  p_payment_intent text,
  p_amount_refunded integer,
  p_currency text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.stripe_events%rowtype;
  v_current_credits integer;
  v_revoke integer;
  v_new_refund integer;
begin
  if coalesce(p_event_id, '') = '' then raise exception 'missing refund event'; end if;
  if coalesce(p_payment_intent, '') = '' then raise exception 'missing payment intent'; end if;
  if p_amount_refunded <= 0 then raise exception 'invalid refund amount'; end if;

  select * into v_purchase
    from public.stripe_events
    where payment_intent = p_payment_intent
    for update;
  if not found then raise exception 'purchase not found for payment intent'; end if;
  if lower(p_currency) <> lower(v_purchase.currency) then
    raise exception 'refund currency mismatch';
  end if;
  if p_amount_refunded < v_purchase.amount_total then
    raise exception 'partial refunds require manual credit review';
  end if;

  insert into public.stripe_refunds (
    id, payment_intent, purchase_event_id, user_id,
    amount_refunded, currency, credits_revoked
  ) values (
    p_event_id, p_payment_intent, v_purchase.id, v_purchase.user_id,
    p_amount_refunded, lower(p_currency), 0
  ) on conflict (id) do nothing;
  get diagnostics v_new_refund = row_count;

  select credits into v_current_credits
    from public.profiles
    where id = v_purchase.user_id
    for update;
  v_current_credits := coalesce(v_current_credits, 0);
  if v_new_refund = 0 or v_purchase.refunded_at is not null then
    return v_current_credits;
  end if;

  perform public.assert_credit_ledger_balance(v_purchase.user_id);
  v_revoke := least(v_current_credits, v_purchase.credits_granted);
  if v_revoke > 0 then
    update public.profiles
      set credits = credits - v_revoke
      where id = v_purchase.user_id
      returning credits into v_current_credits;
    insert into public.credit_ledger (
      user_id, delta, balance_after, reason, idempotency_key,
      stripe_event_id, metadata
    ) values (
      v_purchase.user_id,
      -v_revoke,
      v_current_credits,
      'stripe_refund',
      'stripe-refund:' || p_event_id,
      p_event_id,
      jsonb_build_object(
        'purchase_event_id', v_purchase.id,
        'payment_intent', p_payment_intent,
        'amount_refunded', p_amount_refunded,
        'currency', lower(p_currency),
        'unspent_credits_revoked', v_revoke
      )
    );
  end if;
  update public.stripe_refunds
    set credits_revoked = v_revoke
    where id = p_event_id;
  update public.stripe_events
    set refunded_at = now()
    where id = v_purchase.id;
  return v_current_credits;
end;
$$;
revoke all on function public.refund_stripe_credits(
  text, text, integer, text
)
  from public, anon, authenticated;
