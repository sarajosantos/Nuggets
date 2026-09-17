# Open-beta hardening rollout — 15 September 2026

PR #6 combines template isolation and teaser-budget fixes with strict staff IDs, account-safe cloud callbacks, and durable recovery of the latest completed chapter. Main's reader attribution is preserved.

## Database changes applied

These migrations were applied together in a transaction to production project hublkmtkermhyytcwzjs:

- 20260914000000_lock_down_shares_and_stripe_overloads.sql
- 20260914140000_story_delivery_recovery.sql
- 20260915140000_drop_legacy_seven_arg_stripe_grant.sql

Verified: zero shared_stories policies; RLS enabled; one remaining grant_stripe_credits overload; recovery columns installed; browser roles cannot execute recovery RPCs; service_role can. Reconciliation remained two profiles, zero mismatches, three outstanding credits. The shares table contained zero rows, so no existing public share was available for an end-to-end live check. No rows were deleted by these migrations.

Production had an additional seven-argument Stripe grant absent from current schema.sql. The extra migration removes exactly that obsolete signature; the webhook supplies all eight arguments including payment_intent.

## Configuration and release

ADMIN_USER_IDS must contain verified existing staff account IDs. Remove ADMIN_EMAILS; this release ignores it. The existing staff ID was matched to its longstanding account and the configuration is live in Railway. PR #6 merged as 2a29c8f and deployment 9a44002b is active. The existing staff account successfully opened the publisher ledger and loaded its cloud library.

Teasers are currently disabled. Keep them disabled until a persistent TEASER_SECRET of at least 32 characters is configured.

Operations alert delivery remains incomplete. OPS_ALERT_WEBHOOK_URL needs an actual compatible private receiver. An email address alone is not a webhook. Railway's operations job was scheduled daily at inspection. Verify a monitored destination and appropriate schedule before declaring paid-beta readiness.

## Validation and limits

npm run check: 126 tests passed after the alert-delivery follow-up; zero known production dependency vulnerabilities. GitHub CI passed for 793c441. PostgreSQL tests cover ownership, concurrent claims, replay, stale workers, migration idempotence, rolling deployment, named Stripe fulfillment and event deduplication.

Live checks passed: public home and assets, alternate template paths returning 404, anonymous staff access returning 401, signed-in staff access, ledger reconciliation, interruption during the first chapter followed by Resume, continuation to chapter two, and both chapters surviving reload. The new synthetic story is titled A Field Guide to Still Water, under the Beta recovery test world; existing stories were not changed. Live account switching and public-share publication remain unverified. Payment tests do not establish a real-money purchase/refund rehearsal; obtain specific authorization before charging a real card.

Recovery applies to chapters completed by this release and retains only the latest completed chapter. Previously lost output cannot be reconstructed. Keep additive database changes on rollback; old application versions do not provide the new recovery behavior.

## Email monitoring setup

The alert-delivery follow-up adds optional OPS_HEALTHCHECK_URL support. Create a free Healthchecks check with email delivery to the owner's verified inbox. Set OPS_HEALTHCHECK_URL to its base HTTPS UUID ping URL and OPS_ALERT_WEBHOOK_URL to the same URL with /fail appended. Store these only in Railway variables, not Git. Configure both on the operations service and the webhook on the web service for its existing real-time critical alerts.

A clean scheduled run sends a success heartbeat. Any alert sends a failure signal; failure to query the database also sends a sanitized failure notification. Requests time out after ten seconds, and an unrecognized/rate-limited check is treated as delivery failure. The scheduled job's monitor detects missing executions independently. A later clean operations check marks the monitor recovered; that is a health snapshot, not proof that a previously failed Stripe event has been replayed. Review and resolve payment incidents in Railway/Stripe even after recovery mail.

Use an hourly Railway schedule and a matching one-hour monitor period with ten minutes' grace for beta. Before activation, run the job manually and verify the heartbeat, send a labeled test failure through the monitored destination, confirm email receipt, then restore the healthy state. The existing daily schedule and missing receiver must not be treated as completed monitoring. Email verification and live configuration are still pending at this record's update.
