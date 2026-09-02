# Larkspin paid-reader support runbook

Support address: **support@larkspin.com**

Never ask a reader for a password, full card number, Stripe secret, or Supabase
token. Ask for the account email, approximate purchase time, pack, and the last
four digits shown on their receipt only when needed to distinguish purchases.

## Paid, but stories did not appear

1. Find the Checkout Session in Stripe by customer email and confirm its
   `payment_status` is `paid`.
2. Check webhook delivery for the matching event. Retry a failed signed event;
   do not create a second Checkout Session.
3. In the Publisher's Ledger, confirm that the purchase and credit movement are
   present and that reconciliation reports zero mismatches.
4. If payment is paid but no ledger entry exists, preserve the event IDs and
   logs, disable `STORY_CREDITS_ENABLED` if more than one reader is affected,
   and investigate before adjusting anything.
5. If a correction is required, use an `admin_adjustment` ledger entry with a
   unique idempotency key and written reason. Never edit `profiles.credits`.

## Story failed before its first chapter

The story should return automatically. Ask the reader to refresh and sign in
again. Confirm a paired `story_start` and `story_refund` in the ledger. If the
refund is absent, preserve the story and request IDs from logs before making a
ledger-backed correction.

## Refund request

Confirm the purchaser, Checkout Session, payment intent, amount, currency, and
current credit balance. Issue an eligible refund from Stripe. The signed
`charge.refunded` webhook performs Larkspin's idempotent credit reversal. Verify
the refund row and ledger reconciliation afterward. Never promise a refund
timeframe controlled by the reader's bank.

## Missing or lost story

Confirm whether the reader was signed in and whether the story appears on
another device. Ask them not to clear browser storage until the investigation
is complete. Check cloud `stories` metadata without copying story prose into
support tools. Remind the reader that account export is available from the
Account menu.

## Account access

Direct readers to **Forgot your password?** on the sign-in dialog. Email changes
and password-reset messages require confirmation through Supabase. Do not
manually change credentials or ask readers to send password-reset links.

## Incident thresholds

Run `npm run ops:check` daily during launch week. Immediately pause paid-story
enforcement when the ledger mismatches, multiple paid grants fail, or evidence
suggests duplicate fulfillment. Preserve financial rows and webhook events.
Never roll back or delete the ledger after accepting payments.

Record every financial support action with timestamp, reader account ID,
Stripe event/session IDs, action taken, outcome, and the responding operator.
