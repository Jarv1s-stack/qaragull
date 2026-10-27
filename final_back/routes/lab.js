const express = require("express")
const auth = require("../middleware/auth")
const {
  listProfiles, createProfile, listCareEvents, createCareEvent, createReading, listReadings,
  createExperiment, listExperiments, createMeasurement, createCommunityObservation,
  listCommunityGrid, queueExpertReview,
} = require("../controllers/labController")

const router = express.Router()
const handle = (controller) => (req, res, next) => Promise.resolve(controller(req, res, next)).catch(next)
router.use(auth)
router.get("/profiles", handle(listProfiles))
router.post("/profiles", handle(createProfile))
router.get("/care-events", handle(listCareEvents))
router.post("/care-events", handle(createCareEvent))
router.get("/readings", handle(listReadings))
router.post("/readings", handle(createReading))
router.get("/experiments", handle(listExperiments))
router.post("/experiments", handle(createExperiment))
router.post("/measurements", handle(createMeasurement))
router.get("/community", handle(listCommunityGrid))
router.post("/community", handle(createCommunityObservation))
router.post("/expert-review", handle(queueExpertReview))

module.exports = router
