"use strict";

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { operationalAlerts } = require("../lib/operations");

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const stale = new Date(Date.now() - 15 * 60_000).toISOString();
  const results = await Promise.all([
    client.rpc("credit_ledger_reconciliation"),
    client.from("usage_events").select("kind,status,estimated_cost_micros").gte("created_at", since).limit(50_000),
    client.from("stripe_refunds").select("id").gte("created_at", since).limit(20_000),
    client.from("share_reports").select("id").eq("status", "open").limit(20_000),
    client.from("story_sessions").select("id").eq("status", "generating").lt("updated_at", stale).limit(20_000),
  ]);
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  const reconciliation = Array.isArray(results[0].data) ? results[0].data[0] : results[0].data;
  const report = {
    checkedAt: new Date().toISOString(),
    reconciliation,
    alerts: operationalAlerts({
      reconciliation,
      usage: results[1].data || [],
      refunds: results[2].data || [],
      reports: results[3].data || [],
      sessions: results[4].data || [],
    }),
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

  if (process.env.OPS_ALERT_WEBHOOK_URL && report.alerts.length) {
    const response = await fetch(process.env.OPS_ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!response.ok) throw new Error(`alert webhook returned HTTP ${response.status}`);
  }
  if (report.alerts.some((alert) => alert.severity === "critical")) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Operations check failed:", error.message);
  process.exitCode = 1;
});
