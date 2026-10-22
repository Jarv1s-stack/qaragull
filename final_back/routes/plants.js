const express = require("express")
const auth = require("../middleware/auth")
const upload = require("../middleware/upload")
const {
  identifyPlant,
  getUserScans,
  getScanById,
  deleteScan,
  getUserStats,
} = require("../controllers/plantController")

const router = express.Router()

router.post("/identify", auth, upload.single("plantImage"), identifyPlant)
router.get("/scans", auth, getUserScans)
router.get("/scans/:id", auth, getScanById)
router.delete("/scans/:id", auth, deleteScan)
router.get("/stats", auth, getUserStats)

module.exports = router
