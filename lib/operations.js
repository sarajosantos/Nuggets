"use strict";

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function launchConfiguration(env = process.env, { paid = false } = {}) {
  const checks = [];
  const check = (name, ok, detail, level = "fail") => {
    checks.push({ name, status: ok ? "pass" : level, detail });
  };

  check("Anthropic API key", /^sk-ant-/.test(env.ANTHROPIC_API_KEY || ""), "Live story generation has a server-side key.");
  check("Supabase URL", /^https:\/\/.+\.supabase\.co\/?$/.test(env.SUPABASE_URL || ""), "Accounts point to a hosted Supabase project.");
  check("Supabase anonymous key", !!env.SUPABASE_ANON_KEY, "Browser authentication is configured.");
  check("Supabase service-role key", !!env.SUPABASE_SERVICE_ROLE_KEY, "Server-owned sessions and operations are configured.");
  check("Public origin", env.PUBLIC_APP_URL === "https://larkspin.com", "Checkout and recovery links return to https://larkspin.com.");
  check("Authentication required", env.REQUIRE_AUTH_FOR_LIVE === "1", "Live generation requires a reader account.");
  check("Report hash salt", (env.REPORT_HASH_SALT || "").length >= 32, "Abuse-report identifiers use a unique salt.");
  check(
    "Model cost rates",
    positiveNumber(env.MODEL_INPUT_USD_PER_MILLION, 0) > 0 && positiveNumber(env.MODEL_OUTPUT_USD_PER_MILLION, 0) > 0,
    "Publisher-ledger cost alerts use real provider rates.",
  );
  check("Webhook failpoint removed", !env.STRIPE_WEBHOOK_FAIL_EVENT_ID, "No forced Stripe outage is configured.");
  check("Sandbox checkout disabled", env.STRIPE_SANDBOX_TESTING !== "1", "The public deployment is not exposing sandbox Checkout.", paid ? "fail" : "warn");

  if (paid) {
    check("Paid stories enabled", env.STORY_CREDITS_ENABLED === "1", "Credit enforcement is explicitly enabled.");
    check("Live restricted Stripe key", /^rk_live_/.test(env.STRIPE_SECRET_KEY || ""), "Stripe uses a least-privilege live key.");
    check("Stripe webhook secret", /^whsec_/.test(env.STRIPE_WEBHOOK_SECRET || ""), "Signed live webhook delivery is configured.");
  } else {
    check(
      "Paid stories remain gated",
      env.STORY_CREDITS_ENABLED !== "1",
      "Credits stay off until the real-money rehearsal passes.",
    );
  }

  return checks;
}

function operationalAlerts({ reconciliation, usage = [], refunds = [], reports = [], sessions = [] }, env = process.env) {
  const alerts = [];
  const add = (severity, code, message, value, threshold) => {
    alerts.push({ severity, code, message, value, threshold });
  };
  const mismatchCount = Number(reconciliation && reconciliation.mismatches) || 0;
  if (mismatchCount > 0) add("critical", "ledger_mismatch", `${mismatchCount} reader balance(s) disagree with the immutable ledger.`, mismatchCount, 0);

  const requests = usage.length;
  const failures = usage.filter((row) => row.status !== "ok" && row.status !== "fallback").length;
  const failureRate = requests ? failures / requests : 0;
  const failureThreshold = positiveNumber(env.GENERATION_FAILURE_ALERT_RATE, 0.1);
  if (requests >= 5 && failureRate >= failureThreshold) {
    add("critical", "generation_failure_rate", `Generation failure rate is ${(failureRate * 100).toFixed(1)}%.`, failureRate, failureThreshold);
  }

  const spendUsd = usage.reduce((sum, row) => sum + (Number(row.estimated_cost_micros) || 0), 0) / 1_000_000;
  const spendThreshold = positiveNumber(env.DAILY_MODEL_SPEND_ALERT_USD, 25);
  if (spendUsd >= spendThreshold) add("warning", "daily_model_spend", `Estimated model spend is $${spendUsd.toFixed(2)} in 24 hours.`, spendUsd, spendThreshold);

  const refundThreshold = positiveNumber(env.DAILY_REFUND_ALERT_COUNT, 3);
  if (refunds.length >= refundThreshold) add("warning", "refund_spike", `${refunds.length} refunds were recorded in 24 hours.`, refunds.length, refundThreshold);

  const reportThreshold = positiveNumber(env.REPORT_BACKLOG_ALERT_COUNT, 5);
  if (reports.length >= reportThreshold) add("warning", "report_backlog", `${reports.length} public-share reports are waiting for review.`, reports.length, reportThreshold);

  const coverCount = usage.filter((row) => row.kind === "cover").length;
  const coverThreshold = positiveNumber(env.DAILY_COVER_ALERT_COUNT, 20);
  if (coverCount >= coverThreshold) add("warning", "cover_volume", `${coverCount} AI cover requests were recorded in 24 hours.`, coverCount, coverThreshold);

  if (sessions.length > 0) add("warning", "stale_sessions", `${sessions.length} generating session(s) have been stuck for more than 15 minutes.`, sessions.length, 0);
  return alerts;
}

module.exports = { launchConfiguration, operationalAlerts, positiveNumber };
