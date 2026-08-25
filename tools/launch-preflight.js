"use strict";

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { launchConfiguration } = require("../lib/operations");

const paid = process.argv.includes("--paid");
const checks = launchConfiguration(process.env, { paid });

async function main() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc("credit_ledger_reconciliation");
    const row = Array.isArray(data) ? data[0] : data;
    const mismatches = Number(row && row.mismatches) || 0;
    checks.push({
      name: "Credit ledger reconciliation",
      status: !error && mismatches === 0 ? "pass" : "fail",
      detail: error ? error.message : `${mismatches} mismatched account(s).`,
    });
  } else {
    checks.push({ name: "Credit ledger reconciliation", status: "fail", detail: "Supabase operations credentials are missing." });
  }

  for (const check of checks) {
    const marker = check.status === "pass" ? "PASS" : check.status.toUpperCase();
    process.stdout.write(`[${marker}] ${check.name}: ${check.detail}\n`);
  }
  const failures = checks.filter((check) => check.status === "fail");
  const warnings = checks.filter((check) => check.status === "warn");
  process.stdout.write(`\n${checks.length - failures.length - warnings.length} passed, ${warnings.length} warning(s), ${failures.length} failure(s).\n`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Preflight failed:", error.message);
  process.exitCode = 1;
});
