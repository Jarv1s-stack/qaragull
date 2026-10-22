const { createClient } = require("@supabase/supabase-js")

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "plant-images"
const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60

let client

const getStorage = () => {
  if (client) return client

  const url = process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !secretKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required for image storage.")
  }

  client = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return client
}

const ensureBucket = async () => {
  const storage = getStorage().storage
  const { data: buckets, error: listError } = await storage.listBuckets()
  if (listError) throw new Error(`Supabase Storage could not be checked: ${listError.message}`)
  const existingBucket = buckets.find((bucket) => bucket.name === BUCKET)
  if (existingBucket) {
    if (existingBucket.public) throw new Error(`Supabase Storage bucket "${BUCKET}" must be private.`)
    return
  }

  const { error } = await storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 4 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  })
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Supabase Storage bucket could not be created: ${error.message}`)
  }
}

const uploadImage = async (objectPath, file) => {
  const { error } = await getStorage().storage.from(BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    cacheControl: "3600",
    upsert: false,
  })
  if (error) throw new Error(`Supabase image upload failed: ${error.message}`)
}

const createImageUrl = async (objectPath) => {
  if (!objectPath) return null
  const { data, error } = await getStorage().storage.from(BUCKET).createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS)
  if (error) {
    console.error("Supabase signed URL failed:", error.message)
    return null
  }
  return data.signedUrl
}

const deleteImage = async (objectPath) => {
  if (!objectPath) return
  const { error } = await getStorage().storage.from(BUCKET).remove([objectPath])
  if (error) throw new Error(`Supabase image delete failed: ${error.message}`)
}

module.exports = { BUCKET, ensureBucket, uploadImage, createImageUrl, deleteImage }
