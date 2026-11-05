const express = require("express")
const rateLimit = require("express-rate-limit")
const auth = require("../middleware/auth")
const upload = require("../middleware/upload")
const {
  identifyPlant,
  identifyPlantGuest,
  getUserScans,
  getScanById,
  deleteScan,
  getUserStats,
  refineDiagnosis,
} = require("../controllers/plantController")

const router = express.Router()
const guestIdentifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Қонақ режимінде 15 минутта 5 скан жасауға болады. Кейінірек қайталап көріңіз." },
})

router.post("/identify-guest", guestIdentifyLimiter, upload.single("plantImage"), identifyPlantGuest)
router.post("/identify", auth, upload.single("plantImage"), identifyPlant)
router.get("/scans", auth, getUserScans)
router.get("/scans/:id", auth, getScanById)
router.delete("/scans/:id", auth, deleteScan)
router.get("/stats", auth, getUserStats)
router.post("/scans/:id/follow-up", auth, refineDiagnosis)

module.exports = router
