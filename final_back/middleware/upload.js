const multer = require("multer") // Multer кітапханасын қосу (файлдарды жүктеу үшін)

// Memory storage keeps uploads available to the serverless handler and Supabase client.
const storage = multer.memoryStorage()

// 📸 Файл фильтрі
const fileFilter = (req, file, cb) => {
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Тек JPEG, PNG, WebP немесе GIF суреттерін жүктеңіз"), false)
  }
}

// Multer конфигурациясы
const upload = multer({
  storage: storage, // Сақтау конфигурациясы
  limits: {
    fileSize: 4 * 1024 * 1024, // Vercel Function сұрау шегінен төмен ұстау үшін максимум 4 MB
  },
  fileFilter: fileFilter, // Файл фильтрі
})

module.exports = upload // Мұны басқа файлдарда қолдану үшін экспорттау
