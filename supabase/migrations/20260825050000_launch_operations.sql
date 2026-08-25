-- Larkspin launch operations: bounded cleanup without touching financial data.

-- ---------------------------------------------------------------------------
-- Scheduled operational cleanup
-- ---------------------------------------------------------------------------
-- Financial records and immutable credit-ledger rows are deliberately excluded.
-- Retention values are conservative launch defaults and can be changed only by
-- a service-role caller after the privacy policy and support practice change.
create or replace function public.cleanup_operational_data(
  p_rate_limit_hours integer default 48,
  p_abandoned_session_hours integer default 24,
  p_usage_days integer default 180,
  p_product_days integer default 180,
  p_feedback_days integer default 365,
  p_resolved_report_days integer default 365
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate_limits integer := 0;
  v_sessions integer := 0;
  v_usage integer := 0;
  v_product integer := 0;
  v_feedback integer := 0;
  v_reports integer := 0;
begin
  if least(
    p_rate_limit_hours, p_abandoned_session_hours, p_usage_days,
    p_product_days, p_feedback_days, p_resolved_report_days
  ) < 1 then
    raise exception 'retention values must be positive';
  end if;

  delete from public.rate_limit_buckets
    where updated_at < now() - make_interval(hours => p_rate_limit_hours);
  get diagnostics v_rate_limits = row_count;

  -- Only discard never-charged, never-completed starts that were left in the
  -- generating state. Charged sessions and resumable ready sessions are kept.
  delete from public.story_sessions
    where charged = false
      and chapter_count = 0
      and status = 'generating'
      and updated_at < now() - make_interval(hours => p_abandoned_session_hours);
  get diagnostics v_sessions = row_count;

  delete from public.usage_events
    where created_at < now() - make_interval(days => p_usage_days);
  get diagnostics v_usage = row_count;

  delete from public.product_events
    where created_at < now() - make_interval(days => p_product_days);
  get diagnostics v_product = row_count;

  delete from public.pilot_feedback
    where created_at < now() - make_interval(days => p_feedback_days);
  get diagnostics v_feedback = row_count;

  delete from public.share_reports
    where status <> 'open'
      and created_at < now() - make_interval(days => p_resolved_report_days);
  get diagnostics v_reports = row_count;

  return jsonb_build_object(
    'rate_limit_buckets', v_rate_limits,
    'abandoned_uncharged_sessions', v_sessions,
    'usage_events', v_usage,
    'product_events', v_product,
    'pilot_feedback', v_feedback,
    'resolved_share_reports', v_reports
  );
end;
$$;

revoke all on function public.cleanup_operational_data(integer, integer, integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.cleanup_operational_data(integer, integer, integer, integer, integer, integer)
  to service_role;
