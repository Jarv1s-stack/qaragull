require("dotenv").config()

const { createTables } = require("./config/database")
const { ensureBucket } = require("./services/storage")

async function setup() {
  await createTables()
  await ensureBucket()
  console.log("✅ Supabase database and private plant-images bucket are ready")
}

setup()
  .catch((error) => {
    console.error("Supabase setup failed:", error.message)
    process.exitCode = 1
  })
