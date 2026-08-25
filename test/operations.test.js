"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { launchConfiguration, operationalAlerts } = require("../lib/operations");

test("launch preflight fails closed when paid configuration is incomplete", () => {
  const checks = launchConfiguration({}, { paid: true });
  assert.ok(checks.some((check) => check.name === "Live restricted Stripe key" && check.status === "fail"));
  assert.ok(checks.some((check) => check.name === "Credit ledger reconciliation") === false);
});

test("launch preflight accepts the production-shaped configuration", () => {
  const checks = launchConfiguration({
    ANTHROPIC_API_KEY: "sk-ant-example",
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    PUBLIC_APP_URL: "https://larkspin.com",
    REQUIRE_AUTH_FOR_LIVE: "1",
    REPORT_HASH_SALT: "a".repeat(32),
    MODEL_INPUT_USD_PER_MILLION: "1",
    MODEL_OUTPUT_USD_PER_MILLION: "1",
    STORY_CREDITS_ENABLED: "1",
    STRIPE_SECRET_KEY: "rk_live_example",
    STRIPE_WEBHOOK_SECRET: "whsec_example",
  }, { paid: true });
  assert.deepEqual(checks.filter((check) => check.status === "fail"), []);
});

test("operations health raises critical ledger and generation alerts", () => {
  const alerts = operationalAlerts({
    reconciliation: { mismatches: 2 },
    usage: Array.from({ length: 10 }, (_, index) => ({
      kind: "chapter",
      status: index < 2 ? "failed" : "ok",
      estimated_cost_micros: 100,
    })),
  });
  assert.ok(alerts.some((alert) => alert.code === "ledger_mismatch" && alert.severity === "critical"));
  assert.ok(alerts.some((alert) => alert.code === "generation_failure_rate" && alert.severity === "critical"));
});

test("cleanup never targets financial records or resumable sessions", () => {
  const schema = fs.readFileSync(path.join(__dirname, "..", "supabase", "schema.sql"), "utf8");
  const start = schema.indexOf("create or replace function public.cleanup_operational_data");
  const end = schema.indexOf("revoke all on function public.cleanup_operational_data", start);
  const cleanup = schema.slice(start, end);
  assert.match(cleanup, /charged = false/);
  assert.match(cleanup, /chapter_count = 0/);
  assert.match(cleanup, /status = 'generating'/);
  assert.doesNotMatch(cleanup, /delete from public\.(?:credit_ledger|stripe_events|stripe_refunds)/);
});

test("critical server events are wired to the private operations webhook", () => {
  const server = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  assert.match(server, /OPS_REALTIME_ALERT_EVENTS = new Set/);
  assert.match(server, /"stripe_credit_grant_failed"/);
  assert.match(server, /fetch\(OPS_ALERT_WEBHOOK_URL/);
  assert.doesNotMatch(server, /alert = \{[^}]*userId/s);
});
