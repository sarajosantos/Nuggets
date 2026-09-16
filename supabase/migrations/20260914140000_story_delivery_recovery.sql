-- Durable delivery of the most recent chapter. Existing functions remain for
-- rolling deployments; only service_role can prepare, complete, or replay.
alter table public.story_sessions add column if not exists pending_request_hash text;
alter table public.story_sessions add column if not exists completed_request_hash text;
alter table public.story_sessions add column if not exists last_output text;
alter table public.story_sessions add column if not exists last_output_history_hash text;

create or replace function public.prepare_story_chapter(
  p_user_id uuid, p_story_id uuid, p_start_token uuid,
  p_scenario_hash text, p_character_hash text, p_prior_history_hash text,
  p_request_hash text, p_request_id uuid, p_charge boolean, p_first boolean
) returns table(ok boolean, conflict boolean, story_id uuid, credits integer, first_chapter boolean, replay text)
language plpgsql security definer set search_path = public as $$
declare
  v public.story_sessions%rowtype;
  v_begin record;
  v_id uuid;
  v_credits integer;
begin
  -- Serialize first attempts by stable account/start token, including retries
  -- that did not receive a server id. Continuations serialize on the row.
  if p_first then
    if p_start_token is null then raise exception 'start token required'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_start_token::text, 0));
    select * into v from public.story_sessions
      where user_id = p_user_id and start_token = p_start_token for update;
  else
    select * into v from public.story_sessions
      where id = p_story_id and user_id = p_user_id for update;
  end if;
  if not found then
    if not p_first then
      return query select false,true,p_story_id,0,false,null::text; return;
    end if;
    v_id := gen_random_uuid();
    select * into v_begin from public.begin_story_session_v2(
      p_user_id,v_id,p_scenario_hash,p_character_hash,p_request_id,p_start_token,p_charge);
    if not v_begin.ok then
      return query select false,v_begin.conflict,v_id,v_begin.credits,true,null::text; return;
    end if;
    update public.story_sessions set pending_request_hash = p_request_hash where id = v_id;
    return query select true,false,v_id,v_begin.credits,true,null::text; return;
  end if;
  select profiles.credits into v_credits from public.profiles where id = p_user_id;
  if v.scenario_hash <> p_scenario_hash or v.character_hash <> p_character_hash then
    return query select false,true,v.id,coalesce(v_credits,0),false,null::text; return;
  end if;
  -- Replay only the exact request, and never interfere with another generation.
  if v.status = 'ready' and v.completed_request_hash = p_request_hash and v.last_output is not null
     and v.last_output_history_hash = v.history_hash then
    return query select true,false,v.id,coalesce(v_credits,0),false,v.last_output; return;
  end if;
  if v.status = 'generating' and v.updated_at >= now() - interval '5 minutes' then
    return query select false,true,v.id,coalesce(v_credits,0),false,null::text; return;
  end if;
  if (p_first and (v.chapter_count <> 0 or v.pending_request_hash is distinct from p_request_hash))
     or (not p_first and v.history_hash is distinct from p_prior_history_hash) then
    return query select false,true,v.id,coalesce(v_credits,0),false,null::text; return;
  end if;
  update public.story_sessions set status='generating',active_request_id=p_request_id,
    pending_request_hash=p_request_hash,updated_at=now() where id=v.id;
  return query select true,false,v.id,coalesce(v_credits,0),v.chapter_count=0,null::text;
end;
$$;

create or replace function public.complete_story_chapter_v2(
  p_user_id uuid,p_story_id uuid,p_request_id uuid,p_history_hash text,
  p_chapter_count integer,p_output text
) returns table(ok boolean)
language plpgsql security definer set search_path = public as $$
begin
  if p_output is null or length(p_output) = 0 or length(p_output) > 20000 then
    raise exception 'invalid completed chapter';
  end if;
  update public.story_sessions set history_hash=p_history_hash,chapter_count=p_chapter_count,
    status='ready',active_request_id=null,updated_at=now(),
    completed_request_hash=pending_request_hash,last_output=p_output,last_output_history_hash=p_history_hash
  where id=p_story_id and user_id=p_user_id and status='generating'
    and active_request_id=p_request_id and p_chapter_count=chapter_count+1;
  return query select found;
end;
$$;
revoke all on function public.prepare_story_chapter(uuid,uuid,uuid,text,text,text,text,uuid,boolean,boolean) from public,anon,authenticated;
revoke all on function public.complete_story_chapter_v2(uuid,uuid,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.prepare_story_chapter(uuid,uuid,uuid,text,text,text,text,uuid,boolean,boolean) to service_role;
grant execute on function public.complete_story_chapter_v2(uuid,uuid,uuid,text,integer,text) to service_role;
