const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required for the backend database.")
}

let parsedUrl
try {
  parsedUrl = new URL(supabaseUrl)
} catch {
  throw new Error("SUPABASE_URL must be the project's https://<project-ref>.supabase.co URL.")
}

if (!/^https:$/.test(parsedUrl.protocol) || !parsedUrl.hostname.endsWith(".supabase.co")) {
  throw new Error("SUPABASE_URL must be the project's https://<project-ref>.supabase.co URL.")
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

const createTables = async () => {
  for (const table of ["users", "plant_scans", "plant_profiles", "care_events", "sensor_readings", "experiments", "experiment_measurements", "community_observations", "expert_reviews"]) {
    const { error } = await supabase.from(table).select("id", { head: true }).limit(1)
    if (error) {
      throw new Error(
        `Supabase table "${table}" is unavailable (${error.code || "request failed"}). Run final_back/supabase/schema.sql in Supabase SQL Editor.`,
      )
    }
  }
  console.log("✅ Supabase tables are ready")
}

const checkConnection = async () => {
  const { error } = await supabase.from("users").select("id", { head: true }).limit(1)
  if (error) throw error
}

module.exports = { supabase, createTables, checkConnection }
