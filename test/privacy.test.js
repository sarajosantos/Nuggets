"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "privacy.html"), "utf8");
const schema = fs.readFileSync(path.join(__dirname, "..", "supabase", "schema.sql"), "utf8");

test("the public privacy policy contains no drafting placeholders", () => {
  assert.doesNotMatch(html, /Draft for legal review|Counsel to|\[PRIVACY|\[OPERATOR|\[MINIMUM AGE/);
  assert.match(html, /Beta privacy note/);
  assert.match(html, /Larkspin LLC, a Colorado limited liability company/);
});

test("the privacy policy accurately describes story generation and reader controls", () => {
  assert.match(html, /sent through Larkspin’s server to our AI provider/);
  assert.match(html, /export your Larkspin data/);
  assert.match(html, /permanently delete your account/);
  assert.match(html, /do not sell your personal information/);
});

test("the privacy policy limits Larkspin to adults", () => {
  assert.match(html, /only for people who are 18 or older/);
  assert.match(html, /under 18 may not use the Service, create an account, make a purchase/);
});

test("published stories are readable one link at a time, not in bulk", () => {
  // shared_stories once carried `for select using (true)`, which let anyone
  // holding the browser's publishable anon key page the whole table off
  // PostgREST — every story's text plus the author user_id that links one
  // reader's shares together. Readers are promised "anyone with the link",
  // not "anyone may list every story ever published". The server reads shares
  // with the service-role key, which bypasses RLS, so no policy is needed.
  const shares = schema.slice(
    schema.indexOf("alter table public.shared_stories enable row level security"),
    schema.indexOf("-- Profiles & story credits"),
  );
  assert.ok(shares.length > 0, "shared_stories RLS block not found");
  assert.doesNotMatch(shares, /create policy/);
  assert.match(shares, /drop policy if exists "anyone can read shares"/);
});

test("only the financial-grade Stripe grant survives", () => {
  // Older 3- and 5-argument overloads recorded a purchase with no session,
  // payment intent, amount or currency, so revenue reconciliation could not
  // see it. PostgREST resolves overloads by argument name, so leaving them
  // callable is a standing reconciliation hazard.
  const signatures = [...schema.matchAll(
    /create or replace function public\.grant_stripe_credits\(([^)]*)\)/g,
  )].map(([, args]) => args.split(",").length);
  assert.deepEqual(signatures, [8]);
});

test("the privacy policy states the operational retention schedule", () => {
  assert.match(html, /AI usage records are normally deleted after 180 days/);
  assert.match(html, /rate-limit buckets after 48 hours/);
  assert.match(html, /abandoned, uncharged generation sessions after 24 hours/);
  assert.match(html, /resolved abuse reports after 365 days/);
  assert.match(html, /immutable story-credit ledger/);
});
