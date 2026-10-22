require("dotenv").config()

const express = require("express")
const cors = require("cors")
const path = require("path")
const rateLimit = require("express-rate-limit")
const { checkConnection } = require("./config/database")
const authRoutes = require("./routes/auth")
const plantsRoutes = require("./routes/plants")

const app = express()
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

app.set("trust proxy", 1)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }))
app.use(
  cors({
    origin(origin, callback) {
      const isLocalDevelopmentOrigin =
        process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin || "")
      if (!origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin) return callback(null, true)
      return callback(new Error("Origin is not allowed by CORS"))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))

// Legacy local uploads are not used in production; new scans live in private Supabase Storage.
if (!process.env.VERCEL) app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use("/api/auth", authRoutes)
app.use("/api/plants", plantsRoutes)

app.get("/api/health", async (req, res) => {
  try {
    await checkConnection()
    return res.json({
      status: "OK",
      database: "connected",
      aiConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    })
  } catch (error) {
    console.error("Health check database query failed:", error.message)
    return res.status(503).json({ status: "ERROR", database: "unavailable" })
  }
})

app.use((error, req, res, next) => {
  console.error("Request failed:", error.message)
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Файл өлшемі 4 MB-тан аспауы керек" })
  }
  if (error.message === "Origin is not allowed by CORS") {
    return res.status(403).json({ error: "Бұл веб-мекенжайға API-ге кіруге рұқсат жоқ" })
  }
  if (error.message?.startsWith("Тек JPEG")) {
    return res.status(400).json({ error: error.message })
  }
  return res.status(500).json({ error: "Сервер қатесі" })
})

app.use("*", (req, res) => res.status(404).json({ error: "API endpoint табылмады" }))

module.exports = app
