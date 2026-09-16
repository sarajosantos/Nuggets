"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { deliverOperationsReport, healthcheckUrl } = require("../lib/operations-delivery");
const { launchConfiguration } = require("../lib/operations");
const base = "https://hc-ping.com/00000000-0000-4000-8000-000000000001";
const healthy = { checkedAt: "2026-09-15T00:00:00Z", alerts: [] };
const failed = { ...healthy, alerts: [{ severity: "critical", code: "ledger_mismatch" }] };

test("healthy operations send a heartbeat without paging the webhook", async () => {
  const calls = [];
  await deliverOperationsReport(healthy, { OPS_HEALTHCHECK_URL: base, OPS_ALERT_WEBHOOK_URL: base + "/fail" }, async (url, init) => {
    calls.push(url);
    assert.deepEqual(JSON.parse(init.body), healthy);
    assert.ok(init.signal instanceof AbortSignal);
    assert.equal(init.redirect, "error");
    return new Response("OK");
  });
  assert.deepEqual(calls, [base]);
});

test("alerts fail the monitor once when the webhook uses the same destination", async () => {
  const calls = [];
  await deliverOperationsReport(failed, { OPS_HEALTHCHECK_URL: base, OPS_ALERT_WEBHOOK_URL: base + "/fail" }, async url => {
    calls.push(url); return new Response("OK");
  });
  assert.deepEqual(calls, [base + "/fail"]);
});

test("one broken destination does not prevent notifying another or reveal URLs", async () => {
  const calls = [];
  await assert.rejects(deliverOperationsReport(failed, { OPS_HEALTHCHECK_URL: base, OPS_ALERT_WEBHOOK_URL: "https://alerts.example/secret" }, async url => {
    calls.push(url);
    if (url.startsWith(base)) throw new Error(url);
    return new Response("OK");
  }), { message: "Operations notification delivery failed" });
  assert.equal(calls.length, 2);
});

test("a missing or rate-limited Healthchecks job is not mistaken for delivery", async () => {
  for (const body of ["OK (not found)", "OK (rate limited)"]) {
    await assert.rejects(deliverOperationsReport(healthy, { OPS_HEALTHCHECK_URL: base }, async () => new Response(body)));
  }
});

test("malformed heartbeat configuration fails before sending", async () => {
  for (const url of [base + "/fail", base + "?secret=x", "http://hc-ping.com/x", "https://attacker.example/x"]) {
    assert.equal(healthcheckUrl(url), false);
    await assert.rejects(deliverOperationsReport(healthy, { OPS_HEALTHCHECK_URL: url }, async () => assert.fail("must not send")));
    assert.equal(launchConfiguration({ OPS_HEALTHCHECK_URL: url }).find(c => c.name === "Operations heartbeat URL").status, "fail");
  }
});

test("a failed operations query sends a sanitized critical alert and exits unsuccessfully", async () => {
  const fs = require("node:fs");
  const vm = require("node:vm");
  const calls = [];
  const proc = { env: {}, exitCode: 0 };
  vm.runInNewContext(fs.readFileSync(require.resolve("../tools/operations-check.js"), "utf8"), {
    require(name) {
      if (name === "dotenv") return { config() {} };
      if (name === "@supabase/supabase-js") return {};
      if (name === "../lib/operations") return {};
      if (name === "../lib/operations-delivery") return { async deliverOperationsReport(report) { calls.push(report); } };
      throw new Error(name);
    },
    process: proc, console: { error() {} }, Date,
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(proc.exitCode, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].alerts[0].code, "operations_check_failed");
  assert.equal(calls[0].alerts[0].severity, "critical");
  assert.doesNotMatch(JSON.stringify(calls), /SUPABASE|SERVICE_ROLE/);
});
