"use strict";

// The heartbeat URL is a credential. Never include it in logs or errors.
function healthcheckUrl(value) {
  return /^https:\/\/hc-ping\.com\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || "");
}

async function deliverOperationsReport(report, env = process.env, send = fetch) {
  const failed = report.alerts.length > 0;
  const heartbeat = env.OPS_HEALTHCHECK_URL;
  if (heartbeat && !healthcheckUrl(heartbeat)) throw new Error("OPS_HEALTHCHECK_URL must be a Healthchecks HTTPS ping URL");
  const targets = new Set();
  if (heartbeat) targets.add(heartbeat + (failed ? "/fail" : ""));
  if (failed && env.OPS_ALERT_WEBHOOK_URL) targets.add(env.OPS_ALERT_WEBHOOK_URL);
  // Attempt both destinations even if one is unavailable.
  const results = await Promise.allSettled([...targets].map(async (url) => {
    const response = await send(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });
    if (!response.ok) throw new Error("Operations notification was rejected");
    if (url === heartbeat || url === heartbeat + "/fail") {
      // Healthchecks returns HTTP 200 even for unknown or rate-limited checks.
      if ((await response.text()).trim() !== "OK") throw new Error("Operations heartbeat was not recorded");
    }
  }));
  if (results.some(result => result.status === "rejected")) throw new Error("Operations notification delivery failed");
}

module.exports = { deliverOperationsReport, healthcheckUrl };
