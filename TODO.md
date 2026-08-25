# Larkspin — engineering and product roadmap

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
- [x] Add an immutable story-credit ledger with idempotent grants, charges,
      refunds, and balance reconciliation.
- [x] Grant exactly one welcome story to new accounts and expose a verified
      reader-facing balance counter.
- [x] Run the updated `supabase/schema.sql` in the production Supabase project.
- [x] Deploy with `PUBLIC_APP_URL=https://larkspin.com`,
      `REQUIRE_AUTH_FOR_LIVE=1`, and a unique `REPORT_HASH_SALT`.
- [x] Configure Stripe with a restricted API key, then subscribe the webhook to
      `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
      and `checkout.session.async_payment_failed`.
- [ ] Complete a production test-mode matrix: successful card, declined card,
      delayed payment, webhook replay, webhook outage/retry, refund, concurrent
      first chapter, concurrent continuation, and account switching.
      Signed delivery is verified for completed, delayed-success, and
      delayed-failure events; webhook replay also returns `200`. Concurrent
      first chapters now share a stable start token, while continuation and
      account ownership remain atomically guarded. A successful Reader-pack
      Checkout and full refund now reconcile against the ledger, and replaying
      the same refund is idempotent. A declined Checkout was verified against
      Stripe-hosted sandbox Checkout on 2026-08-07. An exact signed Checkout
      event was forced to `503`, then replayed to `200` after recovery on
      2026-08-07; the failpoint was removed and no duplicate stories were granted.
- [ ] Enable `STORY_CREDITS_ENABLED=1` only after the payment matrix passes.

## P1 — operations and trust

- [x] Record model usage by request, user, story, model, endpoint, and status.
- [x] Add a publisher dashboard for activation, completion, purchases,
      outstanding stories, revenue, model cost, and ledger reconciliation.
- [x] Add account data export and permanent account deletion.
- [x] Add share revocation and reader reporting.
- [x] Add initial privacy, terms, AI-content, and public-sharing disclosures.
- [ ] Have qualified counsel replace/review the privacy policy and terms.
      (Drafts expanded to describe the real stack and data flows, with
      bracketed placeholders for operator identity, jurisdiction, age,
      retention, refund/consumer rights, and liability cap — awaiting an
      attorney to finalize.)
- [x] Set conservative, documented retention periods for operational data;
      financial reconciliation records remain immutable.
- [ ] Schedule the provided `npm run maintenance` job after applying the launch
      operations migration.
- [ ] Connect the provided `npm run ops:check` report to a private alert
      destination and schedule it daily.
- [x] Add a support runbook for paid-but-not-credited purchases and story loss.
- [x] Add password reset and email change; stronger new-account UX can follow
      measured reader feedback.

## P2 — product polish (choose a direction after the hardening PR)

- [x] Improve product explanation and first-story onboarding.
- [x] Turn the library into a richer bookshelf/resume experience.
- [x] Improve retention with deliberate reading rituals and post-story discovery.
- [x] QA the existing worlds' questions, names, archetypes, and traits. Every
      one of the 18 stories now has a cast that fits it: story one keeps the
      cast written for it, stories two and three have their own, so no story
      inherits another's people, places, or props.
- [ ] Expand worlds only after activation, completion, and cost data are visible.

## Guardrail

The narrative architecture is intentionally unchanged: full-history generation,
the pacing director, the state ledger, choice protocol, and streaming reader
remain the core story system.
