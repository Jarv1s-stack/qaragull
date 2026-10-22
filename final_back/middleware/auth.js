const jwt = require("jsonwebtoken")
const { supabase } = require("../config/database")

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return res.status(401).json({ error: "Токен табылмады, кіру рұқсаты жоқ" })

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: "Жарамсыз токен" })
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, avatar")
      .eq("id", decoded.userId)
      .maybeSingle()
    if (error) throw error
    if (!user) return res.status(401).json({ error: "Қолданушы табылмады" })
    req.user = user
    return next()
  } catch (error) {
    console.error("Аутентификация дерекқор қатесі:", error.message)
    return res.status(503).json({ error: "Дерекқор уақытша қолжетімсіз" })
  }
}

module.exports = auth
