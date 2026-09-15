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

ADMIN_USER_IDS must contain verified existing staff account IDs. Remove ADMIN_EMAILS; this release ignores it. The existing staff ID was matched to its longstanding account and the configuration update was submitted in Railway. Verify deployment and staff UI after merging PR #6.

Teasers are currently disabled. Keep them disabled until a persistent TEASER_SECRET of at least 32 characters is configured.

Operations alert delivery remains incomplete. OPS_ALERT_WEBHOOK_URL needs an actual compatible private receiver. An email address alone is not a webhook. Railway's operations job was scheduled daily at inspection. Verify a monitored destination and appropriate schedule before declaring paid-beta readiness.

## Validation and limits

npm run check: 120 tests passed; zero known production dependency vulnerabilities. GitHub CI passed for 793c441. PostgreSQL tests cover ownership, concurrent claims, replay, stale workers, migration idempotence, rolling deployment, named Stripe fulfillment and event deduplication.

Before release completion, verify public home/share pages, alternate static template paths, staff access, account switching, and retry/reload after interrupted chapters. Payment tests do not establish a real-money purchase/refund rehearsal; obtain specific authorization before charging a real card.

Recovery applies to chapters completed by this release and retains only the latest completed chapter. Previously lost output cannot be reconstructed. Keep additive database changes on rollback; old application versions do not provide the new recovery behavior.
