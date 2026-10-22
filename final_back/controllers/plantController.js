const axios = require("axios")
const { randomUUID } = require("crypto")
const { supabase } = require("../config/database")
const { uploadImage, createImageUrl, deleteImage } = require("../services/storage")

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const MODELS = [...new Set([
  process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  process.env.OPENROUTER_FALLBACK_MODEL || "nvidia/nemotron-3.5-super-vl:free",
])]
const PLANT_PROMPT = `Identify the plant in the attached image. Return exactly one valid JSON object, with no markdown or extra explanation. Use Kazakh for all text values except scientificName, which must be the Latin scientific name. If the image is unclear, say "Белгісіз" rather than guessing. accuracy is a subjective confidence estimate from 0 to 100, not a measured scientific accuracy.
{
  "commonName": "өсімдіктің қазақша атауы",
  "scientificName": "латынша ғылыми атауы",
  "description": "қысқаша сипаттама",
  "origin": "шыққан жері немесе белгісіз",
  "sunlight": "жарық қажеттілігі",
  "water": "суару кеңесі",
  "growthRate": "өсу қарқыны",
  "accuracy": 0
}`

const parseJsonResponse = (content) => {
  const text = Array.isArray(content)
    ? content.map((part) => (typeof part === "string" ? part : part.text || "")).join("\n")
    : content

  if (typeof text !== "string" || !text.trim()) throw new Error("OpenRouter returned an empty response")
  const jsonBlock = text.match(/\{[\s\S]*\}/)
  if (!jsonBlock) throw new Error("OpenRouter response did not contain JSON")
  const parsed = JSON.parse(jsonBlock[0])
  const requiredFields = ["commonName", "description", "origin", "sunlight", "water", "growthRate"]
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("OpenRouter JSON is not an object")
  const missingFields = requiredFields.filter((field) => typeof parsed[field] !== "string" || !parsed[field].trim())
  if (missingFields.length) throw new Error(`OpenRouter JSON is missing plant fields: ${missingFields.join(", ")}`)
  return parsed
}

const analyzePlant = async (file) => {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured")

  const imageData = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
  let lastError
  for (const model of MODELS) {
    try {
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model,
          temperature: 0.2,
          max_tokens: 700,
          ...(model.includes("nemotron-3-nano-omni")
            ? { reasoning: { enabled: false } }
            : {
                response_format: { type: "json_object" },
                ...(model.includes("nemotron-3.5-super-vl") ? { reasoning: { enabled: false } } : {}),
              }),
          messages: [
            { role: "system", content: "You are a careful botanist. Return only the requested JSON object." },
            {
              role: "user",
              content: [
                { type: "text", text: PLANT_PROMPT },
                { type: "image_url", image_url: { url: imageData } },
              ],
            },
          ],
        },
        {
          timeout: 25_000,
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.OPENROUTER_SITE_URL || process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173",
            "X-Title": "Qaragull Plant Identifier",
          },
        },
      )
      const parsed = parseJsonResponse(response.data?.choices?.[0]?.message?.content)
      const accuracy = parsed.accuracy == null ? Number.NaN : Number(parsed.accuracy)
      return {
        commonName: String(parsed.commonName || "Белгісіз өсімдік").slice(0, 255),
        scientificName: String(parsed.scientificName || "Белгісіз").slice(0, 255),
        description: String(parsed.description || "Сипаттама берілмеді."),
        origin: String(parsed.origin || "Белгісіз").slice(0, 255),
        sunlight: String(parsed.sunlight || "Белгісіз").slice(0, 255),
        water: String(parsed.water || "Белгісіз").slice(0, 255),
        growthRate: String(parsed.growthRate || "Белгісіз").slice(0, 255),
        accuracy: Number.isFinite(accuracy) ? Math.min(100, Math.max(0, Math.round(accuracy))) : null,
      }
    } catch (error) {
      lastError = error
      if ([401, 402].includes(error.response?.status)) break
      console.error(`OpenRouter model failed (${model}):`, error.response?.status || error.message)
    }
  }

  lastError = lastError || new Error("No OpenRouter model returned a usable response")
  lastError.isOpenRouterError = true
  throw lastError
}

const serializeScan = async (scan) => ({
  id: scan.id,
  imageUrl: scan.storage_path ? await createImageUrl(scan.storage_path) : scan.image_url,
  commonName: scan.common_name,
  scientificName: scan.scientific_name,
  description: scan.description,
  origin: scan.origin,
  sunlight: scan.sunlight,
  water: scan.water,
  growthRate: scan.growth_rate,
  accuracy: scan.accuracy,
  createdAt: scan.created_at,
})

const parseScanId = (value) => {
  if (!/^\d+$/.test(String(value))) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647 ? id : null
}

const identifyPlant = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Сурет файлы табылмады" })

  let storagePath
  try {
    const plant = await analyzePlant(req.file)
    const extensionByMime = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    }
    storagePath = `${req.user.id}/${randomUUID()}${extensionByMime[req.file.mimetype]}`
    await uploadImage(storagePath, req.file)

    const { data: scan, error } = await supabase
      .from("plant_scans")
      .insert({
        user_id: req.user.id,
        image_url: storagePath,
        storage_path: storagePath,
        common_name: plant.commonName,
        scientific_name: plant.scientificName,
        description: plant.description,
        origin: plant.origin,
        sunlight: plant.sunlight,
        water: plant.water,
        growth_rate: plant.growthRate,
        accuracy: plant.accuracy,
      })
      .select("*")
      .single()
    if (error) throw error

    return res.status(201).json({ message: "Өсімдік сәтті анықталды", scan: await serializeScan(scan) })
  } catch (error) {
    if (storagePath) {
      try {
        await deleteImage(storagePath)
      } catch (cleanupError) {
        console.error("Supabase image cleanup failed:", cleanupError.message)
      }
    }

    const status = error.isOpenRouterError ? 502 : error.message?.includes("not configured") ? 503 : 500
    console.error("Plant identification failed:", error.response?.status || error.message)
    return res.status(status).json({
      error: error.isOpenRouterError
        ? "AI қызметі уақытша жауап бермеді. Кейінірек қайталап көріңіз."
        : "Өсімдікті анықтау кезінде қате орын алды",
    })
  }
}

const getUserScans = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page || "1", 10)
    const limit = Number.parseInt(req.query.limit || "10", 10)
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({ error: "Бет нөмірі 1-ден, ал шегі 1–50 аралығында болуы керек" })
    }

    const offset = (page - 1) * limit
    const { data: scans, count: totalScans, error } = await supabase
      .from("plant_scans")
      .select("*", { count: "exact" })
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    const totalPages = Math.ceil(totalScans / limit)

    return res.json({
      scans: await Promise.all(scans.map(serializeScan)),
      pagination: { currentPage: page, totalPages, totalScans, hasNext: page < totalPages, hasPrev: page > 1 },
    })
  } catch (error) {
    console.error("Plant scan history failed:", error.message)
    return res.status(500).json({ error: "Тарихты алу кезінде қате орын алды" })
  }
}

const getScanById = async (req, res) => {
  try {
    const id = parseScanId(req.params.id)
    if (!id) return res.status(400).json({ error: "Сканерлеу нөмірі қате" })
    const { data: scan, error } = await supabase
      .from("plant_scans")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .maybeSingle()
    if (error) throw error
    if (!scan) return res.status(404).json({ error: "Сканерлеу табылмады" })
    return res.json({ scan: await serializeScan(scan) })
  } catch (error) {
    console.error("Plant scan lookup failed:", error.message)
    return res.status(500).json({ error: "Сканерлеуді алу кезінде қате орын алды" })
  }
}

const deleteScan = async (req, res) => {
  try {
    const id = parseScanId(req.params.id)
    if (!id) return res.status(400).json({ error: "Сканерлеу нөмірі қате" })
    const { data: scan, error: lookupError } = await supabase
      .from("plant_scans")
      .select("id, storage_path")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .maybeSingle()
    if (lookupError) throw lookupError
    if (!scan) return res.status(404).json({ error: "Сканерлеу табылмады" })

    const { error } = await supabase.from("plant_scans").delete().eq("id", id).eq("user_id", req.user.id)
    if (error) throw error
    if (scan.storage_path) {
      try {
        await deleteImage(scan.storage_path)
      } catch (storageError) {
        console.error("Supabase image cleanup failed:", storageError.message)
      }
    }
    return res.json({ message: "Сканерлеу сәтті өшірілді" })
  } catch (error) {
    console.error("Plant scan delete failed:", error.message)
    return res.status(500).json({ error: "Сканерлеуді өшіру кезінде қате орын алды" })
  }
}

const getUserStats = async (req, res) => {
  try {
    const records = []
    const pageSize = 1000
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from("plant_scans")
        .select("accuracy, created_at, scientific_name")
        .eq("user_id", req.user.id)
        .range(offset, offset + pageSize - 1)
      if (error) throw error
      records.push(...data)
      if (data.length < pageSize) break
    }

    const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    const accuracies = records.map((scan) => scan.accuracy).filter((value) => Number.isFinite(value))
    const stats = {
      total_scans: records.length,
      this_week: records.filter((scan) => Date.parse(scan.created_at) >= weekCutoff).length,
      avg_accuracy: accuracies.length
        ? Math.round(accuracies.reduce((total, value) => total + value, 0) / accuracies.length)
        : null,
      unique_species: new Set(records.map((scan) => scan.scientific_name).filter(Boolean)).size,
    }
    return res.json({
      stats: {
        totalScans: stats.total_scans,
        thisWeek: stats.this_week,
        avgAccuracy: stats.avg_accuracy,
        uniqueSpecies: stats.unique_species,
      },
    })
  } catch (error) {
    console.error("Plant statistics failed:", error.message)
    return res.status(500).json({ error: "Статистиканы алу кезінде қате орын алды" })
  }
}

module.exports = { identifyPlant, getUserScans, getScanById, deleteScan, getUserStats }
