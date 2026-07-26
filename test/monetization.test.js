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

test("new accounts receive exactly one ledger-backed welcome novella", () => {
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

test("novella packs are server-owned and keep purchase reconciliation metadata", () => {
  assert.match(server, /single:\s*\{ credits: 1, price: 399/);
  assert.match(server, /reader:\s*\{ credits: 5, price: 1500/);
  assert.match(server, /library:\s*\{ credits: 15, price: 3600/);
  assert.match(server, /p_amount_total: grant\.amountTotal/);
  assert.match(server, /p_currency: grant\.currency/);
  assert.match(server, /integration_identifier: `plotwick_\$\{suffix\}`/);
  assert.doesNotMatch(server, /payment_method_types/);
});

test("the reader counter and staff ledger are wired into the product", () => {
  assert.match(html, /id="credits-pill"/);
  assert.match(html, /id="screen-admin"/);
  assert.match(html, /id="admin-reconciliation"/);
  assert.match(app, /class="balance-number"/);
  assert.match(app, /ledgerStatus === "verified"/);
  assert.match(app, /\/api\/admin\/monetization/);
});

test("funnel analytics store bounded identifiers rather than story text", () => {
  assert.match(schema, /create table if not exists public\.product_events/);
  assert.match(server, /const PRODUCT_EVENT_NAMES = new Set/);
  assert.match(server, /REPORT_HASH_SALT}:product:/);
  assert.doesNotMatch(schema, /product_events[\s\S]{0,800}(premise|story_text|chapter_text)/i);
});
