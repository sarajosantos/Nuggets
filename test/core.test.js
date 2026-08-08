"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  checkoutGrant,
  cleanStoryInputs,
  hashValue,
  normalizePublicOrigin,
  sanitizeSvg,
  stripeRefund,
  summarizeMonetization,
  validateHistory,
} = require("../lib/core");

test("hashValue is stable across object key order", () => {
  assert.equal(hashValue({ b: 2, a: 1 }), hashValue({ a: 1, b: 2 }));
  assert.notEqual(hashValue([{ role: "user", content: "a" }]), hashValue([{ role: "user", content: "b" }]));
});

test("story input validation accepts bounded values and rejects missing fields", () => {
  assert.ok(cleanStoryInputs(
    { title: "World", premise: "Trouble comes.", tone: "Literary suspense" },
    { name: "Wren", archetype: "The Witness", trait: "Steady" },
  ));
  assert.equal(cleanStoryInputs(
    { title: "World", premise: "", tone: "Suspense" },
    { name: "Wren", archetype: "Witness", trait: "Steady" },
  ), null);
});

test("history validation enforces first chapter and alternating roles", () => {
  const opening = [{ role: "user", content: "Begin the story." }];
  assert.equal(validateHistory(opening, { firstChapter: true }).ok, true);
  assert.equal(validateHistory([
    ...opening,
    { role: "user", content: "A second user turn" },
  ]).ok, false);
  assert.equal(validateHistory([
    ...opening,
    { role: "assistant", content: "Chapter" },
    { role: "user", content: "Continue" },
  ]).ok, true);
});

test("SVG sanitizer removes active and external content", () => {
  const safe = sanitizeSvg('<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="#fff"/></svg>');
  assert.match(safe, /^<svg/);
  assert.equal(sanitizeSvg('<svg onload="alert(1)"><script>alert(1)</script></svg>'), null);
  assert.equal(sanitizeSvg('<svg><image href="https://attacker.example/x"/></svg>'), null);
});

test("Stripe grants only exact, paid, server-defined packs", () => {
  const packs = { starter: { credits: 5, price: 800 } };
  const paid = {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        payment_status: "paid",
        amount_total: 800,
        currency: "usd",
        payment_intent: "pi_test_1",
        client_reference_id: "user-1",
        metadata: { user_id: "user-1", pack_id: "starter" },
      },
    },
  };
  assert.deepEqual(checkoutGrant(paid, packs, "usd"), {
    userId: "user-1",
    credits: 5,
    packId: "starter",
    sessionId: "cs_test_1",
    paymentIntent: "pi_test_1",
    amountTotal: 800,
    currency: "usd",
  });
  assert.equal(checkoutGrant({
    ...paid,
    data: { object: { ...paid.data.object, amount_total: 1 } },
  }, packs, "usd"), null);
  assert.equal(checkoutGrant({
    ...paid,
    data: { object: { ...paid.data.object, payment_status: "unpaid" } },
  }, packs, "usd"), null);
});

test("Stripe refunds only fully refunded charges tied to a payment intent", () => {
  const event = {
    type: "charge.refunded",
    data: {
      object: {
        id: "ch_test_1",
        refunded: true,
        payment_intent: "pi_test_1",
        amount_refunded: 800,
        currency: "USD",
      },
    },
  };
  assert.deepEqual(stripeRefund(event), {
    chargeId: "ch_test_1",
    paymentIntent: "pi_test_1",
    amountRefunded: 800,
    currency: "usd",
  });
  assert.equal(stripeRefund({
    ...event,
    data: { object: { ...event.data.object, refunded: false } },
  }), null);
  assert.equal(stripeRefund({ ...event, type: "refund.created" }), null);
});

test("public origin rejects credentials and insecure remote HTTP", () => {
  assert.equal(normalizePublicOrigin("https://plotwick.com/path"), "https://plotwick.com");
  assert.equal(normalizePublicOrigin("http://localhost:3000"), "http://localhost:3000");
  assert.equal(normalizePublicOrigin("http://plotwick.com"), null);
  assert.equal(normalizePublicOrigin("https://user:pass@plotwick.com"), null);
});

test("monetization summary reconciles balances and counts unique funnel readers", () => {
  const summary = summarizeMonetization({
    currency: "usd",
    profiles: [{ id: "u1", credits: 4 }],
    ledger: [
      { user_id: "u1", reason: "stripe_purchase", delta: 5, balance_after: 4, created_at: "2026-07-02" },
      { user_id: "u1", reason: "story_start", delta: -1, balance_after: 0, created_at: "2026-07-01" },
    ],
    events: [
      { event: "world_selected", actor_key: "user:u1", world_id: "romance", metadata: { pilotCohort: "founding-readers" }, created_at: "2026-07-02" },
      { event: "world_selected", actor_key: "user:u1", world_id: "romance", created_at: "2026-07-02" },
      { event: "story_completed", actor_key: "user:u1", world_id: "romance", created_at: "2026-07-02" },
    ],
    usage: [{ input_tokens: 100, output_tokens: 200, estimated_cost_micros: 25_000, status: "ok", created_at: "2026-07-02" }],
    purchases: [{ amount_total: 1500, stripe_fee: 74, currency: "usd", created_at: "2026-07-02" }],
    refunds: [{ amount_refunded: 500, stripe_fee: 0, currency: "usd", created_at: "2026-07-03" }],
    feedback: [{ cohort: "founding-readers", rating: 5, would_pay: true, completion_state: "finished", created_at: "2026-07-03" }],
    sessions: [{ id: "story-1" }],
    since: "2026-07-01",
  });
  assert.equal(summary.overview.outstandingCredits, 4);
  assert.equal(summary.overview.revenueCents, 1500);
  assert.equal(summary.overview.grossRevenueCents, 1500);
  assert.equal(summary.overview.refundsCents, 500);
  assert.equal(summary.overview.netRevenueCents, 1000);
  assert.equal(summary.overview.stripeFeesCents, 74);
  assert.equal(summary.overview.netAfterFeesCents, 926);
  assert.equal(summary.overview.financialsComplete, true);
  assert.equal(summary.funnel.world_selected.events, 2);
  assert.equal(summary.funnel.world_selected.readers, 1);
  assert.equal(summary.worlds[0].completed, 1);
  assert.equal(summary.pilots[0].cohort, "founding-readers");
  assert.equal(summary.pilots[0].funnel.world_selected, 1);
  assert.equal(summary.pilots[0].feedback.averageRating, 5);
  assert.equal(summary.pilots[0].feedback.wouldPay, 1);
  assert.equal(summary.reconciliation.status, "verified");
});

test("monetization summary flags missing Stripe fee metadata", () => {
  const summary = summarizeMonetization({
    purchases: [{ amount_total: 399, stripe_fee: null, currency: "usd", created_at: "2026-07-02" }],
    since: "2026-07-01",
  });
  assert.equal(summary.overview.financialsComplete, false);
  assert.equal(summary.overview.stripeFeesCents, 0);
});
