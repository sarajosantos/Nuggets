"use strict";

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.rpc("cleanup_operational_data");
  if (error) throw error;
  process.stdout.write(`${JSON.stringify({ completedAt: new Date().toISOString(), deleted: data }, null, 2)}\n`);
}

main().catch((error) => {
  console.error("Maintenance failed:", error.message);
  process.exitCode = 1;
});
