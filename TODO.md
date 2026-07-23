# Plotwick — engineering and product roadmap

Priority order reflects launch risk. Do not enable paid acquisition until every
P0 item is deployed and tested in the production environment.

## P0 — deploy and verify the hardening release

- [x] Replace browser-trusted credit IDs with server-owned story sessions.
- [x] Bind every continuation to its owner, scenario, character, and rolling
      completed-history hash.
- [x] Prevent concurrent/replayed chapter generation and safely release failed
      sessions; refund a failed first chapter once.
- [x] Isolate local libraries by account and require explicit consent before
      importing anonymous device stories.
- [x] Make credit enforcement explicit (`STORY_CREDITS_ENABLED=1`) and fail
      startup if payments are unavailable, unless an intentional free-credit
      pilot is configured.
- [x] Validate paid Stripe sessions against server-owned pack, amount, currency,
      user, and payment status; support delayed-payment success/failure.
- [x] Use an authoritative `PUBLIC_APP_URL` for Checkout redirects.
- [x] Add distributed Supabase-backed rate limits for story, cover, sharing,
      reporting, and Checkout endpoints.
- [x] Default AI-generated SVG covers off; require authentication and a strict
      quota when explicitly enabled.
- [x] Add security headers, a strict Content Security Policy, and a strict SVG
      allowlist.
- [x] Add automated tests, dependency auditing, and GitHub Actions CI.
- [ ] Run the updated `supabase/schema.sql` in the production Supabase project.
- [ ] Deploy with `PUBLIC_APP_URL=https://plotwick.com`,
      `REQUIRE_AUTH_FOR_LIVE=1`, and a unique `REPORT_HASH_SALT`.
- [ ] Configure Stripe with a restricted API key, then subscribe the webhook to
      `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
      and `checkout.session.async_payment_failed`.
- [ ] Complete a production test-mode matrix: successful card, declined card,
      delayed payment, webhook replay, webhook outage/retry, refund, concurrent
      first chapter, concurrent continuation, and account switching.
- [ ] Enable `STORY_CREDITS_ENABLED=1` only after the payment matrix passes.

## P1 — operations and trust

- [x] Record model usage by request, user, story, model, endpoint, and status.
- [x] Add an admin metrics endpoint for recent request and token totals.
- [x] Add account data export and permanent account deletion.
- [x] Add share revocation and reader reporting.
- [x] Add initial privacy, terms, AI-content, and public-sharing disclosures.
- [ ] Have qualified counsel replace/review the starter privacy policy and terms.
- [ ] Set measured retention periods for usage events, reports, rate-limit
      buckets, abandoned story sessions, and Stripe reconciliation records.
- [ ] Add a scheduled cleanup job for expired rate-limit buckets and abandoned
      uncharged sessions.
- [ ] Connect alerts for generation failure rate, Stripe grant failures, cover
      volume, daily token spend, refund spikes, and report backlog.
- [ ] Add a support runbook for paid-but-not-credited purchases and story loss.
- [ ] Add password reset, email change, and stronger new-account UX.

## P2 — product polish (choose a direction after the hardening PR)

- [ ] Improve product explanation and first-story onboarding.
- [ ] Turn the library into a richer bookshelf/resume experience.
- [ ] Improve retention with deliberate reading rituals and post-story discovery.
- [ ] Expand worlds only after activation, completion, and cost data are visible.

## Guardrail

The narrative architecture is intentionally unchanged: full-history generation,
the pacing director, the state ledger, choice protocol, and streaming reader
remain the core story system.
