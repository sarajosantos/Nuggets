# Plotwick — to-do

Running list of planned work. Newest ideas at the top of each section.

## UX / polish
- [ ] **Dedicated "Create account" screen for new users.** Right now sign-up
      reuses the sign-in modal (single password field). Build a proper create-
      account experience with a **confirm-password field** (enter password
      twice, validate they match before submitting) and clear inline errors.
      Consider: show password strength/length hint, friendly success state,
      and a smooth hand-off into their first story.

## Payments
- [ ] Wire Stripe so non-admin users can buy credits: set `STRIPE_SECRET_KEY`
      and `STRIPE_WEBHOOK_SECRET` in Railway; add the webhook endpoint
      (`https://plotwick.com/api/stripe/webhook`, event
      `checkout.session.completed`); test with card 4242 4242 4242 4242.
- [ ] Review/finalize credit-pack pricing in `CREDIT_PACKS` (server.js) before
      charging real money (currently placeholder: 5/$8, 15/$20, 40/$45).

## Content
- [ ] Write new worlds collaboratively before coding them in. Candidate batch:
      Espionage, Heist, Noir, Cyberpunk, Norse Saga.

## Done
- [x] Accounts + cloud library (Supabase).
- [x] Server-side pay-per-story credit gate with atomic spend/refund RPCs.
- [x] Admin accounts (`ADMIN_EMAILS`) with unlimited stories for testing.
- [x] Fix sign-in "Invalid path" error (normalize `SUPABASE_URL`: strip
      trailing slashes and stray API paths like `/rest/v1`).
