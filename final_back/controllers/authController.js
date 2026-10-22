const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")
const { supabase } = require("../config/database")

const register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { fullName, email, password } = req.body
    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()
    if (lookupError) throw lookupError
    if (existingUser) return res.status(400).json({ error: "Бұл email мекенжайы бұрын тіркелген" })

    const hashedPassword = await bcrypt.hash(password, 12)
    const { data: user, error } = await supabase
      .from("users")
      .insert({ full_name: fullName, email, password: hashedPassword })
      .select("id, full_name, email")
      .single()
    if (error) {
      if (error.code === "23505") return res.status(400).json({ error: "Бұл email мекенжайы бұрын тіркелген" })
      throw error
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" })
    return res.status(201).json({
      message: "Қолданушы сәтті тіркелді",
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email },
    })
  } catch (error) {
    console.error("Тіркелу қатесі:", error.message)
    return res.status(500).json({ error: "Сервер қатесі" })
  }
}

const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email, password } = req.body
    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, avatar, password")
      .eq("email", email)
      .maybeSingle()
    if (error) throw error
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Қате email немесе құпия сөз" })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" })
    return res.json({
      message: "Сәтті кірілді",
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, avatar: user.avatar },
    })
  } catch (error) {
    console.error("Кіру қатесі:", error.message)
    return res.status(500).json({ error: "Сервер қатесі" })
  }
}

const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, avatar")
      .eq("id", req.user.id)
      .maybeSingle()
    if (error) throw error
    if (!user) return res.status(404).json({ error: "Қолданушы табылмады" })
    return res.json({ user: { id: user.id, fullName: user.full_name, email: user.email, avatar: user.avatar } })
  } catch (error) {
    console.error("Профиль алу қатесі:", error.message)
    return res.status(500).json({ error: "Сервер қатесі" })
  }
}

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { fullName, email } = req.body
    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .neq("id", req.user.id)
      .maybeSingle()
    if (lookupError) throw lookupError
    if (existingUser) return res.status(400).json({ error: "Бұл email мекенжайы басқа қолданушыда бар" })

    const { data: user, error } = await supabase
      .from("users")
      .update({ full_name: fullName, email, updated_at: new Date().toISOString() })
      .eq("id", req.user.id)
      .select("id, full_name, email, avatar")
      .maybeSingle()
    if (error) {
      if (error.code === "23505") return res.status(400).json({ error: "Бұл email мекенжайы басқа қолданушыда бар" })
      throw error
    }
    if (!user) return res.status(404).json({ error: "Қолданушы табылмады" })

    return res.json({
      message: "Профиль сәтті жаңартылды",
      user: { id: user.id, fullName: user.full_name, email: user.email, avatar: user.avatar },
    })
  } catch (error) {
    console.error("Профиль жаңарту қатесі:", error.message)
    return res.status(500).json({ error: "Сервер қатесі" })
  }
}

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { currentPassword, newPassword } = req.body
    const { data: user, error: lookupError } = await supabase
      .from("users")
      .select("password")
      .eq("id", req.user.id)
      .maybeSingle()
    if (lookupError) throw lookupError
    if (!user) return res.status(404).json({ error: "Қолданушы табылмады" })
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ error: "Ағымдағы құпия сөз қате" })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    const { error } = await supabase
      .from("users")
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq("id", req.user.id)
    if (error) throw error
    return res.json({ message: "Құпия сөз сәтті өзгертілді" })
  } catch (error) {
    console.error("Құпия сөз өзгерту қатесі:", error.message)
    return res.status(500).json({ error: "Сервер қатесі" })
  }
}

module.exports = { register, login, getProfile, updateProfile, changePassword }
