# Anonymous teaser rollout

Turning on the free first chapter for signed-out visitors. The code shipped
dormant — nothing changes on the live site until step 4.

Read [`docs/MONETIZATION_ROLLOUT.md`](MONETIZATION_ROLLOUT.md) first if credits
are not already live; this builds on that system and spends against the same
ledger.

## The one ordering rule

**Apply the migration before setting `TEASER_ENABLED=1`.**

The flag does not depend on the migration, so nothing stops you enabling it
first — and the failure is silent and expensive. Teasers would generate
normally (real API spend), the reader would read a chapter, and then adoption
would fail with a 500 because `adopt_teaser_session` does not exist. The reader
loses the story they just read, and we paid for it.

Nothing else in this document can hurt you. That step can.

## Step 0 — preflight

1. Confirm `main` is deployed and healthy at or after `c3bc8df`.
2. Back up the production Supabase database.
3. Run `credit_ledger_reconciliation()` with a privileged role. Continue only
   when `mismatched_accounts` is zero. Teasers charge through the same ledger,
   so start from a clean one.
4. Note the current daily API spend. You want a before number to compare
   against.

## Step 1 — apply the migration

Run [`supabase/migrations/20260807050000_teaser_adoption.sql`](../supabase/migrations/20260807050000_teaser_adoption.sql),
or re-run [`supabase/schema.sql`](../supabase/schema.sql) — both are idempotent
and both create `adopt_teaser_session`. No tables, columns, or constraints
change; this only adds a function.

Verify it exists and is locked down:

```sql
select proname from pg_proc where proname = 'adopt_teaser_session';
-- expect exactly one row

select has_function_privilege('anon',
  'public.adopt_teaser_session(uuid,uuid,text,text,text,uuid,boolean)', 'execute');
-- expect false
```

## Step 2 — set the secret

```bash
openssl rand -hex 32
```

Set it as `TEASER_SECRET`. **Do not skip this.** Without it the server generates
a random secret at boot, so every restart or redeploy invalidates every
outstanding teaser: those readers open the page and find their chapter can no
longer be redeemed.

Keep it server-side only, like `REPORT_HASH_SALT`. Rotating it later is safe but
invalidates teasers in flight, so rotate at a quiet hour.

## Step 3 — walk the flow in staging

This sequence has not been run end to end against a live Supabase. Do it once,
in staging, with `TEASER_ENABLED=1`, before enabling in production.

1. **Signed out**, pick a built-in world, build a character, click
   **Light a story →**. Chapter one should stream. Confirm in the database that
   **no** `story_sessions` row and **no** `credit_ledger` row were created.
2. The three choices render but are not clickable, under the sign-in panel.
3. Sign in from that panel with a brand new account. The story should continue
   from the same chapter — not restart — and exactly one story should be spent:
   one `credit_ledger` row, reason `story_start`, key `story:<id>:start`.
4. Chapter two generates and continues the same character. This is the step that
   proves the seeded `history_hash` matches what `claim_story_chapter` expects.
5. Play to the end. Confirm the story behaves like any other and appears in the
   library.
6. Run `credit_ledger_reconciliation()`. Expect zero mismatches.

Then the negative cases:

7. **Forged chapter.** Edit the saved teaser text in localStorage, then sign in.
   Expect a 409 and no charge; the reader is offered a fresh start instead.
8. **Custom premise.** Write your own scenario while signed out. Expect the
   normal sign-in wall with no chapter generated.
9. **Limit.** Take a second teaser from the same browser the same day. Expect the
   wall. Then clear site data and confirm a fresh visitor is still served.
10. **Refund.** Point `STORY_MODEL` at a bad value and force chapter two to fail
    after adoption. The story must come back — one `story_refund` ledger row —
    and the session must be released. This is the `chapter_count = 0` behavior
    and the single easiest thing in the design to get wrong.

Do not enable in production until 1–6 pass and 10 refunds correctly.

## Step 4 — enable in production

Set `TEASER_ENABLED=1` and redeploy.

Confirm immediately:

```bash
curl -s https://larkspin.com/api/config | jq '.teaserEnabled'   # expect true
```

Then run steps 1–4 above once against production with a throwaway account. One
real teaser costs about six cents; buying certainty for that is a good trade.

## Step 5 — what to watch

**First hour.** Teaser count and error rate. A spike in `teaser_adopt_failed` in
the logs means the migration did not take.

**First week.** The only number that decides whether this stays on:

```
teaser_adopted / teaser_started
```

Both are recorded as product events and appear in the publisher's ledger
alongside `teaser` usage, which is deliberately kept separate from `chapter`
usage so acquisition cost does not hide inside cost of goods.

At roughly 6¢ per teaser against a $3.99 pack, **break-even is about 1.7%**.

| Adoption rate | Read as |
|---|---|
| below 1.7% | losing money — tighten or turn off |
| 1.7–5% | working; leave it and keep watching |
| above 5% | the wall was the bottleneck; consider raising the limits |

Also watch daily teaser spend against `TEASER_DAILY_LIMIT`. Hitting the ceiling
regularly means either real demand (good — raise it deliberately) or someone
farming (check the spread of distinct visitor ids per IP).

## Rollback

Set `TEASER_ENABLED=0` and redeploy. That is the whole rollback.

It is clean because teasers write nothing: no sessions, no ledger rows, no
stories. There is no data to unwind and nothing to reconcile. Visitors go back
to the sign-in wall on their next click.

Leave the migration in place. `adopt_teaser_session` is inert when nothing calls
it, and dropping it would break any teaser still in a reader's browser.

Stories already adopted are ordinary stories and keep working — they were paid
for and are indistinguishable from any other.

## The dials

| Env var | Default | Notes |
|---|---|---|
| `TEASER_ENABLED` | `0` | The switch. |
| `TEASER_SECRET` | random per boot | Set it. See step 2. |
| `TEASER_PER_VISITOR_PER_DAY` | `1` | Per anonymous session id. |
| `TEASER_PER_IP_PER_DAY` | `5` | Backstop only. Keep it above the per-visitor limit — offices, universities and carrier NAT share one address, and a tight per-IP cap means one stranger blocks a whole network. |
| `TEASER_DAILY_LIMIT` | `200` | Global ceiling. ~$12/day worst case. Spending it falls back to the auth wall. |
| `TEASER_TTL_SECONDS` | 7 days | How long a saved teaser stays redeemable. |

## If a built-in world's text changes

`lib/worlds.js` is generated from the catalogue in `public/app.js`. Editing a
title, premise, or tone changes its hash, and teasers for that story silently
stop working — the visitor just sees the ordinary sign-in wall, with nothing in
the logs to explain it.

After any such edit:

```bash
node tools/build-worlds.js
npm test          # test/teaser.test.js fails if these drift
```

CI catches it, but only if the test runs before deploy.
