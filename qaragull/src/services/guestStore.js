const STORAGE_KEY = "qaragull.guest.data.v1"
const GUEST_MODE_KEY = "qaragull.guestMode"
const MAX_GUEST_SCANS = 20

const readStore = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    return {
      scans: Array.isArray(parsed.scans) ? parsed.scans : [],
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      careEvents: Array.isArray(parsed.careEvents) ? parsed.careEvents : [],
      readings: Array.isArray(parsed.readings) ? parsed.readings : [],
      experiments: Array.isArray(parsed.experiments) ? parsed.experiments : [],
      observations: Array.isArray(parsed.observations) ? parsed.observations : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    }
  } catch {
    return { scans: [], profiles: [], careEvents: [], readings: [], experiments: [], observations: [], reviews: [] }
  }
}

const writeStore = (store) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    return true
  } catch {
    throw new Error("Браузер жады толды. Қонақ жазбаларын өшіріп көріңіз.")
  }
}

const response = (data) => Promise.resolve({ data })
const newId = () => `guest-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`

export const guestStore = {
  addScan(scan) {
    const store = readStore()
    store.scans = [scan, ...store.scans].slice(0, MAX_GUEST_SCANS)
    if (!writeStore(store)) throw new Error("Браузер жады толды. Ескі қонақ скандарын өшіріп көріңіз.")
    return scan
  },
  getScans(page = 1, limit = 10) {
    const scans = readStore().scans
    const offset = (page - 1) * limit
    const totalPages = Math.ceil(scans.length / limit)
    return response({ scans: scans.slice(offset, offset + limit), pagination: { currentPage: page, totalPages, totalScans: scans.length, hasNext: page < totalPages, hasPrev: page > 1 } })
  },
  getScan(id) {
    const scan = readStore().scans.find((item) => String(item.id) === String(id))
    return scan ? response({ scan }) : Promise.reject({ response: { data: { error: "Скан табылмады" } } })
  },
  deleteScan(id) {
    const store = readStore()
    store.scans = store.scans.filter((item) => String(item.id) !== String(id))
    writeStore(store)
    return response({ message: "Скан браузер жадынан өшірілді" })
  },
  getStats() {
    const scans = readStore().scans
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const accuracies = scans.map((scan) => scan.accuracy).filter((value) => Number.isFinite(value))
    return response({ stats: {
      totalScans: scans.length,
      thisWeek: scans.filter((scan) => Date.parse(scan.createdAt) >= weekAgo).length,
      avgAccuracy: accuracies.length ? Math.round(accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length) : null,
      uniqueSpecies: new Set(scans.map((scan) => scan.scientificName).filter(Boolean)).size,
    } })
  },
  getProfiles() { return response({ profiles: readStore().profiles }) },
  createProfile(data) {
    const store = readStore()
    const scan = store.scans.find((item) => String(item.id) === String(data.scanId))
    const profile = { id: newId(), name: data.name, common_name: data.commonName, scientific_name: data.scientificName || null, scan_id: scan?.id || null, created_at: new Date().toISOString() }
    store.profiles.unshift(profile)
    writeStore(store)
    return response({ profile })
  },
  getCareEvents(profileId) { return response({ events: readStore().careEvents.filter((item) => String(item.profile_id) === String(profileId)) }) },
  createCareEvent(data) {
    const store = readStore()
    const event = { id: newId(), profile_id: data.profileId, event_type: data.eventType, notes: data.notes || "", created_at: new Date().toISOString() }
    store.careEvents.unshift(event)
    writeStore(store)
    return response({ event })
  },
  getReadings() { return response({ readings: readStore().readings }) },
  createReading(data) {
    const store = readStore()
    const reading = { id: newId(), profile_id: data.profileId || null, source: data.source === "serial" ? "serial" : "demo", soil_moisture: data.soilMoisture ?? null, light_lux: data.lightLux ?? null, temperature_c: data.temperatureC ?? null, leaf_signal: data.leafSignal ?? null, created_at: new Date().toISOString() }
    store.readings.unshift(reading)
    store.readings = store.readings.slice(0, 100)
    writeStore(store)
    return response({ reading })
  },
  getExperiments() { return response({ experiments: readStore().experiments }) },
  createExperiment(data) {
    const store = readStore()
    const experiment = { id: newId(), title: data.title, hypothesis: data.hypothesis || "", measurements: [], created_at: new Date().toISOString() }
    store.experiments.unshift(experiment)
    writeStore(store)
    return response({ experiment })
  },
  createMeasurement(data) {
    const store = readStore()
    const experiment = store.experiments.find((item) => String(item.id) === String(data.experimentId))
    if (!experiment) return Promise.reject({ response: { data: { error: "Тәжірибе табылмады" } } })
    const measurement = { id: newId(), experiment_id: experiment.id, height_cm: data.heightCm === "" ? null : Number(data.heightCm) || null, leaf_count: data.leafCount === "" ? null : Number(data.leafCount) || null, soil_moisture: data.soilMoisture === "" ? null : Number(data.soilMoisture) || null, notes: data.notes || "", created_at: new Date().toISOString() }
    experiment.measurements.push(measurement)
    writeStore(store)
    return response({ measurement })
  },
  getCommunity() {
    const cells = new Map()
    readStore().observations.forEach((item) => {
      if (item.latitude == null || item.latitude === "" || item.longitude == null || item.longitude === "") return
      const latitude = Number(item.latitude)
      const longitude = Number(item.longitude)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
      const key = `${latitude.toFixed(1)}:${longitude.toFixed(1)}:${item.issue || "Басқа"}`
      const cell = cells.get(key) || { latitude: Number(latitude.toFixed(1)), longitude: Number(longitude.toFixed(1)), issue: item.issue || "Басқа", count: 0 }
      cell.count += 1
      cells.set(key, cell)
    })
    return response({ cells: [...cells.values()], observationsAvailable: false })
  },
  createCommunityObservation(data) {
    const store = readStore()
    const observation = {
      id: newId(),
      ...data,
      latitude: data.latitude == null || data.latitude === "" ? null : Number(Number(data.latitude).toFixed(1)),
      longitude: data.longitude == null || data.longitude === "" ? null : Number(Number(data.longitude).toFixed(1)),
      created_at: new Date().toISOString(),
      localOnly: true,
    }
    store.observations.unshift(observation)
    writeStore(store)
    return response({ observation, localOnly: true })
  },
  requestExpertReview(data) {
    const store = readStore()
    store.reviews.unshift({ id: newId(), ...data, created_at: new Date().toISOString() })
    writeStore(store)
    return response({ message: "Өтініш осы браузерде сақталды; маманға жіберілген жоқ." })
  },
}

export const makeGuestId = newId
export const isGuestSession = () => localStorage.getItem(GUEST_MODE_KEY) === "1"
