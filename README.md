# Plotwick 📖

**[plotwick.com](https://plotwick.com)** — an AI-powered choose-your-own-adventure platform. Pick a scenario (or write your own), create a character, and get a novella-style story written live by Claude — with three choices at the end of every chapter, plus the option to write your own action.

## Features

- **Six built-in worlds + custom scenarios** — fantasy, sci-fi, murder mystery, gothic horror, western, Regency intrigue, or bring your own premise.
- **Streaming novella prose** — chapters stream in word by word over Server-Sent Events, typeset like a book (drop caps, running heads, asterism dividers).
- **A hidden "story director"** — the server injects private pacing directives each chapter (setup → escalation → midpoint reversal → convergence → climax) so stories arc properly instead of meandering, and a hard cap forces a finale if a story runs long. Players choose *how* events unfold; the director ensures they *do*.
- **State ledger & journal** — the model maintains hidden JSON state every chapter (title, act, condition, inventory, companions, open plot threads) and re-reads it for continuity. The Journal panel shows the player their condition, items, and companions.
- **Accounts & cloud library (Supabase)** — sign in with email/password and your library follows you across devices. Local stories merge into your account on sign-in.
- **Pay-per-story credits (Stripe)** — one credit begins one story (all its chapters). Server-owned story sessions bind continuations to their owner, scenario, character, and rolling history hash; a failed first chapter is auto-refunded.
- **Story library** — every story is saved locally; resume in-progress tales or re-read finished ones.
- **Share links** — publish a finished story to a read-only link (`/s/:id`) with its cover and full text.
- **Generated cover art** — deterministic SVG covers by default; optional, authenticated AI covers are strictly sanitized and quota-limited.
- **Read aloud** — browser text-to-speech narration toggle.
- **Rate limiting** — distributed per-user/per-IP limits backed by Supabase in production.
- **Demo mode** — with no API key, the app serves a canned three-chapter preview so the entire UI works out of the box.

## How it works

- **Frontend** (`public/`) — vanilla HTML/CSS/JS, no build step. A deliberate single dark theme ("the midnight reading room"): Cormorant Garamond display, Crimson Pro book prose, candle-gold accent.
- **Backend** (`server.js`) — Express. Keeps provider keys server-side and streams chapters from `claude-opus-4-8` (adaptive thinking). The client sends full history each turn, while Supabase stores compact integrity metadata so the server can reject forged or replayed continuations.
- **Story protocol** — each model response is `prose + <state>{...}</state> + <choices>[...]</choices>`. An empty choices array signals the ending. Pacing notes ride as mid-conversation system messages on `claude-opus-4-8` (merged into the user turn on other models).

## Running it

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm start              # http://localhost:3000
```

## Accounts setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the project's **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql) — it creates the `stories` and `shared_stories` tables with row-level security (users can only touch their own stories).
3. From **Project Settings → API**, copy into `.env`:
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` — enables sign-in and the cloud library
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only secret; never expose it to the browser) — moves published share links into Postgres too
4. Optional: under **Authentication → Providers → Email**, turn off "Confirm email" for instant signups, or configure SMTP so confirmation emails deliver.

Without these vars the app runs exactly as before — libraries stay device-local and shares fall back to a JSON file. The browser talks to Supabase directly for auth and story sync (protected by RLS); the server only verifies tokens (for per-account rate limiting) and writes shares.

Story credits are deliberately opt-in. Set `STORY_CREDITS_ENABLED=1` only after Stripe, its webhook, and `PUBLIC_APP_URL` are configured and tested. The server refuses to start with an incomplete paid setup unless `ALLOW_FREE_ONLY_CREDITS=1` explicitly declares a free-credit pilot.

## Payments setup (Stripe)

Selling credits needs Stripe on top of Supabase:

1. Create an account at [stripe.com](https://stripe.com). Start in **test mode** (toggle top-right) so you can rehearse with fake cards.
2. **Developers → API keys** → copy the **Secret key** into `.env` as `STRIPE_SECRET_KEY`.
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-DOMAIN/api/stripe/webhook`
   - Events: **`checkout.session.completed`**, **`checkout.session.async_payment_succeeded`**, and **`checkout.session.async_payment_failed`**
   - After creating it, copy the endpoint's **Signing secret** into `.env` as `STRIPE_WEBHOOK_SECRET`.
4. Restart. The "Buy stories" button appears for signed-in users.
5. Set `PUBLIC_APP_URL`, run the payment test matrix in [`TODO.md`](TODO.md), then set `STORY_CREDITS_ENABLED=1`.
6. Prefer a restricted Stripe key (`rk_…`) with only the permissions this service needs. Use separate test and live credentials and restrict their network access in Stripe.

> ⚠️ **Pricing is a placeholder.** The credit packs and prices live in `CREDIT_PACKS` near the top of `server.js` (currently 5/$8, 15/$20, 40/$45). A full story costs roughly ~$1 in Claude API usage, so a credit is priced above that for margin — but review and set your own numbers before charging anyone. Prices are defined server-side; the browser can never change them.

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Enables live story generation |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | — | Enables accounts + cloud library |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Enables server story sessions, distributed limits, shares, credits, and operations |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | — | Enables buying credits via Stripe; prefer a restricted key |
| `STRIPE_CURRENCY` | `usd` | Checkout currency |
| `PUBLIC_APP_URL` | — | Authoritative origin for Stripe return URLs |
| `STORY_CREDITS_ENABLED` | `0` | Explicitly enables pay-per-story enforcement |
| `ALLOW_FREE_ONLY_CREDITS` | `0` | Allows an intentional no-purchase credit pilot |
| `REQUIRE_AUTH_FOR_LIVE` | `1` with Supabase | Requires accounts for live generation |
| `AI_COVERS` | `0` | Enables authenticated, quota-limited model-generated SVG covers |
| `REPORT_HASH_SALT` | — | Salt used to pseudonymize share reporters' IPs |
| `ADMIN_EMAILS` | — | Comma-separated emails that get unlimited stories (testing/staff) |
| `STORY_MODEL` | `claude-opus-4-8` | Which Claude model narrates |
| `TARGET_CHAPTERS` | `10` | Target story length; finale forced by target + 4 |
| `RATE_LIMIT_PER_HOUR` | `40` | Max chapters per IP per hour |
| `PORT` | `3000` | Server port |
| `DEMO_MODE` | auto | `1` forces canned demo content |

## Roadmap

- **OAuth sign-in** (Google/GitHub) — Supabase supports it; add providers in the dashboard and a button per provider
- **Raster cover art** via an image model, replacing SVG covers
- **Dice-style skill checks** driven by archetype/trait for mechanical depth
- **Cost dashboards** and per-user quotas before a public launch
