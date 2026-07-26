# Plotwick monetization rollout

Plotwick's paid-credit system should be enabled only after the database ledger,
Stripe fulfillment, and reader-facing balance agree. The application fails
closed when the cached profile balance and immutable ledger diverge.

## Before deployment

1. Back up the production Supabase database.
2. Apply `supabase/schema.sql` before deploying the application code.
3. Run `credit_ledger_reconciliation()` with a privileged database role.
   Continue only when `mismatched_accounts` is zero.
4. Configure production environment values:
   - `STRIPE_SECRET_KEY` (prefer a restricted key)
   - `STRIPE_WEBHOOK_SECRET`
   - `REPORT_HASH_SALT`
   - `MODEL_INPUT_USD_PER_MILLION`
   - `MODEL_OUTPUT_USD_PER_MILLION`
5. Leave `STORY_CREDITS_ENABLED=false` during verification.

Existing readers keep their current balance. New readers receive exactly one
welcome novella, recorded in the ledger with a unique idempotency key.

## Stripe verification

Use Stripe test mode and verify every pack:

- Single novella: 1 for $3.99
- Reader pack: 5 for $15
- Library pack: 15 for $36

For each pack:

1. Complete one checkout and confirm the webhook returns success.
2. Confirm the credit balance increases exactly once.
3. Retry the same webhook and confirm the balance does not change.
4. Confirm amount and currency appear in the publisher's ledger.
5. Submit an unpaid or mismatched checkout event and confirm no credits are
   granted.

Also test a story start, a failed first chapter, and a retry. The balance should
decrease once, be refunded once after failure, and never become negative.

## Controlled launch

1. Deploy the application while credits remain disabled.
2. Sign in as a new reader and confirm the counter says `1 novella left` and
   `first one included`.
3. Sign in as an existing reader and confirm their preserved balance.
4. Open the admin Publisher's Ledger and confirm:
   - reconciliation is healthy;
   - outstanding credits match the database;
   - purchases and credit movements are present;
   - no raw story text or user IDs are displayed.
5. Set `STORY_CREDITS_ENABLED=true` and redeploy.
6. Complete one real low-value purchase and one story start.
7. Re-run `credit_ledger_reconciliation()` and require zero mismatches.

## Monitoring and incident response

- Check the Publisher's Ledger daily during the first week and weekly
  thereafter.
- Treat any reconciliation mismatch as a launch-blocking incident. Disable
  `STORY_CREDITS_ENABLED`, preserve the ledger, and investigate the relevant
  Stripe event or story session.
- Do not edit `profiles.credits` directly. Corrections must be recorded as an
  `admin_adjustment` ledger entry with a unique idempotency key and a written
  reason.
- Stripe may retry webhooks. This is expected; the globally unique event and
  ledger keys make fulfillment idempotent.
- Keep Stripe secrets and the Supabase service-role key server-side only.

## Rollback

Set `STORY_CREDITS_ENABLED=false` and redeploy the previous application
version. Do not remove ledger rows or roll back the database migration after
payments have been processed. The ledger is the financial record and should be
preserved for reconciliation.
