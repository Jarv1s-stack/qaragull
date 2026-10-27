const { supabase } = require("../config/database")

const fail = (res, message, status = 400) => res.status(status).json({ error: message })
const idFrom = (value) => {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const listProfiles = async (req, res) => {
  const { data, error } = await supabase.from("plant_profiles").select("*").eq("user_id", req.user.id).order("created_at", { ascending: false })
  if (error) return fail(res, "Өсімдік профилін алу мүмкін болмады", 500)
  return res.json({ profiles: data })
}

const createProfile = async (req, res) => {
  const name = String(req.body.name || "").trim().slice(0, 120)
  const commonName = String(req.body.commonName || "").trim().slice(0, 255)
  const scientificName = String(req.body.scientificName || "").trim().slice(0, 255)
  const scanId = req.body.scanId ? idFrom(req.body.scanId) : null
  if (!name || !commonName) return fail(res, "Өсімдік атауын енгізіңіз")
  if (req.body.scanId && !scanId) return fail(res, "Скан нөмірі қате")
  if (scanId) {
    const { data: scan, error } = await supabase.from("plant_scans").select("id").eq("id", scanId).eq("user_id", req.user.id).maybeSingle()
    if (error) return fail(res, "Сканерлеуді тексеру мүмкін болмады", 500)
    if (!scan) return fail(res, "Бұл скан сізге тиесілі емес", 404)
  }
  const { data, error } = await supabase.from("plant_profiles").insert({
    user_id: req.user.id, name, common_name: commonName, scientific_name: scientificName || null, scan_id: scanId,
  }).select("*").single()
  if (error) return fail(res, "Өсімдік профилін сақтау мүмкін болмады", 500)
  return res.status(201).json({ profile: data })
}

const listCareEvents = async (req, res) => {
  const profileId = idFrom(req.query.profileId)
  if (!profileId) return fail(res, "Өсімдік профилін таңдаңыз")
  const { data, error } = await supabase.from("care_events").select("*").eq("user_id", req.user.id).eq("profile_id", profileId).order("created_at", { ascending: false }).limit(100)
  if (error) return fail(res, "Күтім тарихын алу мүмкін болмады", 500)
  return res.json({ events: data })
}

const createCareEvent = async (req, res) => {
  const profileId = idFrom(req.body.profileId)
  const eventType = String(req.body.eventType || "").trim().slice(0, 40)
  const notes = String(req.body.notes || "").trim().slice(0, 1000)
  if (!profileId || !eventType) return fail(res, "Күтім түрін таңдаңыз")
  const { data: profile, error: profileError } = await supabase.from("plant_profiles").select("id").eq("id", profileId).eq("user_id", req.user.id).maybeSingle()
  if (profileError) return fail(res, "Өсімдік профилін тексеру мүмкін болмады", 500)
  if (!profile) return fail(res, "Өсімдік профилі табылмады", 404)
  const { data, error } = await supabase.from("care_events").insert({ user_id: req.user.id, profile_id: profileId, event_type: eventType, notes }).select("*").single()
  if (error) return fail(res, "Күтім жазбасын сақтау мүмкін болмады", 500)
  return res.status(201).json({ event: data })
}

const createReading = async (req, res) => {
  const profileId = req.body.profileId ? idFrom(req.body.profileId) : null
  if (req.body.profileId && !profileId) return fail(res, "Өсімдік профилі қате")
  if (profileId) {
    const { data: profile, error } = await supabase.from("plant_profiles").select("id").eq("id", profileId).eq("user_id", req.user.id).maybeSingle()
    if (error) return fail(res, "Өсімдік профилін тексеру мүмкін болмады", 500)
    if (!profile) return fail(res, "Өсімдік профилі табылмады", 404)
  }
  const numeric = (key, min, max) => {
    if (req.body[key] === null || req.body[key] === undefined || req.body[key] === "") return null
    const value = Number(req.body[key])
    return Number.isFinite(value) && value >= min && value <= max ? value : NaN
  }
  const reading = {
    soil_moisture: numeric("soilMoisture", 0, 100),
    light_lux: numeric("lightLux", 0, 200000),
    temperature_c: numeric("temperatureC", -50, 80),
    leaf_signal: numeric("leafSignal", -10000, 10000),
  }
  if (Object.values(reading).some(Number.isNaN)) return fail(res, "Сенсор көрсеткіші рұқсат етілген аралықтан тыс")
  const source = req.body.source === "serial" ? "serial" : "demo"
  const { data, error } = await supabase.from("sensor_readings").insert({ user_id: req.user.id, profile_id: profileId, source, ...reading }).select("*").single()
  if (error) return fail(res, "Сенсор өлшемін сақтау мүмкін болмады", 500)
  return res.status(201).json({ reading: data })
}

const listReadings = async (req, res) => {
  const { data, error } = await supabase.from("sensor_readings").select("*").eq("user_id", req.user.id).order("created_at", { ascending: false }).limit(100)
  if (error) return fail(res, "Сенсор тарихын алу мүмкін болмады", 500)
  return res.json({ readings: data })
}

const createExperiment = async (req, res) => {
  const title = String(req.body.title || "").trim().slice(0, 160)
  const hypothesis = String(req.body.hypothesis || "").trim().slice(0, 1000)
  if (!title) return fail(res, "Тәжірибеге атау беріңіз")
  const { data, error } = await supabase.from("experiments").insert({ user_id: req.user.id, title, hypothesis }).select("*").single()
  if (error) return fail(res, "Тәжірибені сақтау мүмкін болмады", 500)
  return res.status(201).json({ experiment: data })
}

const listExperiments = async (req, res) => {
  const { data: experiments, error } = await supabase.from("experiments").select("*").eq("user_id", req.user.id).order("created_at", { ascending: false }).limit(50)
  if (error) return fail(res, "Тәжірибелерді алу мүмкін болмады", 500)
  if (!experiments.length) return res.json({ experiments: [] })
  const { data: measurements, error: measurementError } = await supabase.from("experiment_measurements").select("*").eq("user_id", req.user.id).in("experiment_id", experiments.map((item) => item.id)).order("created_at", { ascending: true })
  if (measurementError) return fail(res, "Өлшемдерді алу мүмкін болмады", 500)
  return res.json({ experiments: experiments.map((item) => ({ ...item, measurements: measurements.filter((row) => row.experiment_id === item.id) })) })
}

const createMeasurement = async (req, res) => {
  const experimentId = idFrom(req.body.experimentId)
  if (!experimentId) return fail(res, "Тәжірибені таңдаңыз")
  const { data: experiment, error: lookupError } = await supabase.from("experiments").select("id").eq("id", experimentId).eq("user_id", req.user.id).maybeSingle()
  if (lookupError) return fail(res, "Тәжірибені тексеру мүмкін болмады", 500)
  if (!experiment) return fail(res, "Тәжірибе табылмады", 404)
  const measurement = {
    height_cm: req.body.heightCm === "" || req.body.heightCm == null ? null : Number(req.body.heightCm),
    leaf_count: req.body.leafCount === "" || req.body.leafCount == null ? null : Number(req.body.leafCount),
    soil_moisture: req.body.soilMoisture === "" || req.body.soilMoisture == null ? null : Number(req.body.soilMoisture),
  }
  if (measurement.height_cm != null && (!Number.isFinite(measurement.height_cm) || measurement.height_cm < 0 || measurement.height_cm > 10000)) return fail(res, "Биіктік мәнін тексеріңіз")
  if (measurement.leaf_count != null && (!Number.isInteger(measurement.leaf_count) || measurement.leaf_count < 0 || measurement.leaf_count > 100000)) return fail(res, "Жапырақ санын тексеріңіз")
  if (measurement.soil_moisture != null && (!Number.isFinite(measurement.soil_moisture) || measurement.soil_moisture < 0 || measurement.soil_moisture > 100)) return fail(res, "Ылғал мәнін 0–100 аралығында енгізіңіз")
  const { data, error } = await supabase.from("experiment_measurements").insert({ user_id: req.user.id, experiment_id: experimentId, group_name: String(req.body.groupName || "Бақылау").trim().slice(0, 80), notes: String(req.body.notes || "").trim().slice(0, 1000), ...measurement }).select("*").single()
  if (error) return fail(res, "Өлшемді сақтау мүмкін болмады", 500)
  return res.status(201).json({ measurement: data })
}

const protectedNames = ["tulipa greigii", "tulipa kaufmanniana", "tulipa regelii", "malus sieversii", "грейг қызғалдағы", "кауфман қызғалдағы", "регель қызғалдағы", "сиверс алмасы"]
const isProtected = (name = "") => protectedNames.some((protectedName) => String(name).toLowerCase().includes(protectedName))

const createCommunityObservation = async (req, res) => {
  const commonName = String(req.body.commonName || "").trim().slice(0, 255)
  const scientificName = String(req.body.scientificName || "").trim().slice(0, 255)
  const issue = String(req.body.issue || "").trim().slice(0, 120)
  if (!commonName || req.body.consent !== true) return fail(res, "Жариялауға нақты келісім беріңіз")
  if (isProtected(scientificName) || isProtected(commonName)) return fail(res, "Қорғалатын түрді қауымдастық картасына жіберуге болмайды")
  const lat = req.body.latitude == null ? null : Number(req.body.latitude)
  const lng = req.body.longitude == null ? null : Number(req.body.longitude)
  if ((lat === null) !== (lng === null) || (lat !== null && (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 40.5 || lat > 55.5 || lng < 46 || lng > 87.5))) {
    return fail(res, "Қазақстан ішіндегі жуық координатты енгізіңіз")
  }
  const record = {
    user_id: req.user.id, common_name: commonName, scientific_name: scientificName || null, issue: issue || null, consent: true,
    grid_lat: lat === null ? null : Math.round(lat * 4) / 4,
    grid_lng: lng === null ? null : Math.round(lng * 4) / 4,
  }
  const { error } = await supabase.from("community_observations").insert(record)
  if (error) return fail(res, "Бақылауды сақтау мүмкін болмады", 500)
  return res.status(201).json({ message: "Бақылау жуық координатпен сақталды" })
}

const listCommunityGrid = async (req, res) => {
  const { data, error } = await supabase.from("community_observations").select("common_name, scientific_name, issue, grid_lat, grid_lng, created_at").eq("consent", true).gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).not("grid_lat", "is", null).limit(1000)
  if (error) return fail(res, "Қауымдастық картасын алу мүмкін болмады", 500)
  const groups = new Map()
  for (const row of data) {
    if (!row.issue) continue
    const key = `${row.grid_lat}:${row.grid_lng}:${row.issue}`
    const item = groups.get(key) || { latitude: Number(row.grid_lat), longitude: Number(row.grid_lng), issue: row.issue, count: 0, species: row.common_name }
    item.count += 1
    groups.set(key, item)
  }
  return res.json({ cells: [...groups.values()].filter((cell) => cell.count >= 3) })
}

const queueExpertReview = async (req, res) => {
  const scanId = req.body.scanId ? idFrom(req.body.scanId) : null
  const question = String(req.body.question || "").trim().slice(0, 1000)
  if (req.body.scanId && !scanId) return fail(res, "Скан нөмірі қате")
  if (scanId) {
    const { data: scan, error } = await supabase.from("plant_scans").select("id").eq("id", scanId).eq("user_id", req.user.id).maybeSingle()
    if (error) return fail(res, "Сканды тексеру мүмкін болмады", 500)
    if (!scan) return fail(res, "Скан табылмады", 404)
  }
  const { data, error } = await supabase.from("expert_reviews").insert({ user_id: req.user.id, scan_id: scanId, question }).select("id, status, created_at").single()
  if (error) return fail(res, "Сарапшы кезегіне қосу мүмкін болмады", 500)
  return res.status(201).json({ review: data, message: "Сарапшыға жіберу сұрауы кезекке сақталды. Нақты маман жауабы қолжетімді екені кепіл емес." })
}

module.exports = {
  listProfiles, createProfile, listCareEvents, createCareEvent, createReading, listReadings,
  createExperiment, listExperiments, createMeasurement, createCommunityObservation,
  listCommunityGrid, queueExpertReview,
}
