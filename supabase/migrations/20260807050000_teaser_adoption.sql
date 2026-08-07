-- Adopt an anonymous teaser chapter into a real, owned story.
-- Adds adopt_teaser_session; no table or constraint changes.

-- ---------------------------------------------------------------------------
-- Adopt an anonymous teaser chapter into a real, owned story.
--
-- A teaser is chapter one generated for a visitor with no account: no session,
-- no ledger entry, no charge. When they sign in to keep reading, this turns that
-- chapter into an ordinary story session and takes the Wick. From here on the
-- story is indistinguishable from one begun the normal way, so claim_story_chapter
-- and the reconciliation views need no special cases.
--
-- Two details matter and are easy to get wrong:
--
--   * history_hash is seeded to the hash of [opening, chapter] — exactly what
--     complete_story_chapter would have written after a normal chapter one — so
--     the very next claim_story_chapter call matches.
--
--   * chapter_count stays 0, NOT 1. It counts chapters delivered *under the
--     charge*, and the teaser chapter was free. fail_story_chapter only refunds
--     when chapter_count = 0, so seeding 1 here would silently swallow the Wick
--     when the reader's first paid chapter fails.
-- ---------------------------------------------------------------------------
create or replace function public.adopt_teaser_session(
  p_user_id uuid,
  p_story_id uuid,
  p_scenario_hash text,
  p_character_hash text,
  p_history_hash text,
  p_start_token uuid,
  p_charge boolean
)
returns table (ok boolean, charged boolean, credits integer, conflict boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits integer;
begin
  insert into public.story_sessions (
    id, user_id, scenario_hash, character_hash, history_hash,
    chapter_count, status, active_request_id, start_token, charged
  ) values (
    p_story_id, p_user_id, p_scenario_hash, p_character_hash, p_history_hash,
    0, 'ready', null, p_start_token, p_charge
  )
  on conflict (user_id, start_token) where start_token is not null do nothing;

  if not found then
    select profiles.credits into v_credits
      from public.profiles where id = p_user_id;
    return query select false, false, coalesce(v_credits, 0), true;
    return;
  end if;

  if p_charge then
    perform public.assert_credit_ledger_balance(p_user_id);
    update public.profiles
      set credits = profiles.credits - 1
      where id = p_user_id and profiles.credits > 0
      returning profiles.credits into v_credits;
    if not found then
      delete from public.story_sessions
        where id = p_story_id and user_id = p_user_id;
      return query select false, false, 0, false;
      return;
    end if;
    insert into public.credit_ledger (
      user_id, delta, balance_after, reason, idempotency_key, story_id
    ) values (
      p_user_id,
      -1,
      v_credits,
      'story_start',
      'story:' || p_story_id::text || ':start',
      p_story_id
    );
    insert into public.story_starts (story_id, user_id)
      values (p_story_id::text, p_user_id);
  else
    select profiles.credits into v_credits
      from public.profiles where id = p_user_id;
  end if;

  return query select true, p_charge, coalesce(v_credits, 0), false;
end;
$$;

revoke all on function public.adopt_teaser_session(
  uuid, uuid, text, text, text, uuid, boolean
) from public, anon, authenticated;
