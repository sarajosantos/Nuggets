"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const schema = fs.readFileSync(path.join(root, "supabase", "schema.sql"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");

test("new accounts receive exactly one ledger-backed welcome story", () => {
  assert.match(schema, /credits integer not null default 1/);
  assert.match(schema, /create table if not exists public\.credit_ledger/);
  assert.match(schema, /idempotency_key text not null unique/);
  assert.match(schema, /'welcome_novella', 'welcome:' \|\| new\.id::text/);
});

test("story starts, refunds, and Stripe grants all write the immutable ledger", () => {
  assert.match(schema, /'story_start',\s*'story:' \|\| p_story_id::text \|\| ':start'/s);
  assert.match(schema, /'story_refund',\s*'story:' \|\| p_story_id::text \|\| ':refund'/s);
  assert.match(schema, /'stripe_purchase',\s*'stripe:' \|\| p_event_id/s);
  assert.match(schema, /credit_ledger_reconciliation/);
  assert.match(schema, /revoke all on function public\.credit_ledger_reconciliation\(\)/);
  assert.match(schema, /assert_credit_ledger_balance/);
  assert.match(schema, /raise exception 'credit ledger mismatch'/);
});

test("concurrent first chapters share an idempotent start token", () => {
  assert.match(schema, /start_token uuid/);
  assert.match(schema, /unique index if not exists story_sessions_start_token_idx/);
  assert.match(schema, /on conflict \(user_id, start_token\) where start_token is not null do nothing/);
  assert.match(server, /begin_story_session_v2/);
  assert.match(server, /p_start_token: startToken \|\| crypto\.randomUUID\(\)/);
  assert.match(app, /startToken: crypto\.randomUUID\(\)/);
});

test("Story packs are server-owned and keep purchase reconciliation metadata", () => {
  assert.match(server, /single:\s*\{ credits: 1, price: 399/);
  assert.match(server, /reader:\s*\{ credits: 5, price: 1500/);
  // Deliberately two packs while repeat-purchase rate is unknown.
  assert.doesNotMatch(server, /library:\s*\{ credits: 15/);
  assert.match(server, /payments:\s*PAYMENTS_ENABLED/);
  assert.match(server, /p_amount_total: grant\.amountTotal/);
  assert.match(server, /p_currency: grant\.currency/);
  assert.match(server, /integration_identifier: `larkspin_\$\{suffix\}`/);
  assert.doesNotMatch(server, /payment_method_types/);
});

test("sandbox checkout is explicit, visibly labeled, and cannot use live credentials", () => {
  assert.match(server, /STRIPE_SANDBOX_TESTING === "1"/);
  assert.match(server, /STRIPE_TEST_KEY/);
  assert.match(server, /requires a Stripe test-mode key/);
  assert.match(server, /cannot be combined with STORY_CREDITS_ENABLED=1/);
  assert.match(server, /if \(!PAYMENTS_ENABLED\) return res\.status\(503\)/);
  assert.match(server, /admin && !SANDBOX_CHECKOUT_ENABLED/);
  assert.match(html, /Sandbox test · no real charges/);
  assert.match(app, /Stripe sandbox checkout\. Test cards only; no real charge will be made\./);
  assert.match(server, /STRIPE_WEBHOOK_FAIL_EVENT_ID && event\.id === STRIPE_WEBHOOK_FAIL_EVENT_ID/);
  assert.ok(
    server.indexOf("stripe.webhooks.constructEvent") < server.indexOf("stripe_webhook_test_outage"),
    "the outage failpoint must run only after signature verification",
  );
});

test("the reader counter and staff ledger are wired into the product", () => {
  assert.match(html, /id="credits-pill"/);
  assert.match(html, /id="price-note-buy"[^>]*>Buy story credits/);
  assert.match(app, /priceNoteBuy\.addEventListener\("click", openBuyModal\)/);
  assert.match(html, /id="screen-admin"/);
  assert.match(html, /id="admin-reconciliation"/);
  assert.match(app, /class="balance-number"/);
  assert.match(app, /ledgerStatus === "verified"/);
  assert.match(app, /\/api\/admin\/monetization/);
  assert.match(schema, /stripe_events add column if not exists stripe_fee integer/);
  assert.match(schema, /stripe_refunds add column if not exists stripe_fee integer/);
  assert.match(server, /captureStripePurchaseFinancials/);
  assert.match(server, /captureStripeRefundFinancials/);
  assert.match(app, /Net receipts/);
  assert.match(html, /id="admin-pilots"/);
  assert.match(app, /PILOT_COHORT_KEY/);
  assert.match(server, /safeMetadata\.pilotCohort/);
  assert.match(schema, /create table if not exists public\.pilot_feedback/);
  assert.match(server, /app\.post\("\/api\/pilot\/feedback"/);
  assert.match(html, /id="pilot-feedback-modal"/);
});

test("funnel analytics store bounded identifiers rather than story text", () => {
  assert.match(schema, /create table if not exists public\.product_events/);
  assert.match(server, /const PRODUCT_EVENT_NAMES = new Set/);
  assert.match(server, /REPORT_HASH_SALT}:product:/);
  assert.doesNotMatch(schema, /product_events[\s\S]{0,800}(premise|story_text|chapter_text)/i);
});
