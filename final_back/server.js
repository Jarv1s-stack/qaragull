require("dotenv").config()

const app = require("./app")
const { createTables } = require("./config/database")
const { ensureBucket } = require("./services/storage")
const PORT = Number.parseInt(process.env.PORT || "5002", 10)

const start = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.")
  }
  if (!process.env.OPENROUTER_API_KEY && !process.env.PLANTNET_API_KEY) {
    throw new Error("At least one AI provider must be configured: OPENROUTER_API_KEY or PLANTNET_API_KEY.")
  }

  await createTables()
  await ensureBucket()

  app.listen(PORT, () => {
    const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((origin) => origin.trim())
    console.log(`Qaragull API listening on port ${PORT}`)
    console.log(`Allowed web origins: ${allowedOrigins.join(", ")}`)
    console.log(
      `OpenRouter models: ${process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"} → ${process.env.OPENROUTER_FALLBACK_MODEL || "nvidia/nemotron-3.5-super-vl:free"}`,
    )
  })
}

if (require.main === module) {
  start().catch((error) => {
    console.error("API startup failed:", error.message)
    process.exitCode = 1
  })
}

module.exports = app
