const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")
const { createClient } = require("@supabase/supabase-js")
const { supabase } = require("../config/database")
const { uploadImage, createImageUrl, deleteImage } = require("../services/storage")
const { randomUUID } = require("crypto")

const avatarUrl = async (storedAvatar) => {
  if (!storedAvatar) return null
  if (!storedAvatar.startsWith("avatars/")) return storedAvatar
  return createImageUrl(storedAvatar)
}

const clientUser = async (user) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  avatar: await avatarUrl(user.avatar),
})

const createEmailAuthClient = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
)

const emailProviderError = (error) => {
  const message = String(error?.message || "").toLowerCase()
  if (error?.status === 429 || /rate limit|too many requests|over_email_send_rate_limit/.test(message)) {
    return { status: 429, message: "Email жіберу шегіне жетті. Біраздан соң қайта көріңіз." }
  }
  if (/email_address_not_authorized|email address not authorized/.test(message)) {
    return { status: 503, message: "Supabase-тың әдепкі пошта қызметі тек команда мүшелеріне жібереді. Басқа email-дарға жіберу үшін SMTP баптау қажет." }
  }
  return { status: 502, message: "Email жіберілмеді. Supabase Auth пошта баптауын тексеріңіз." }
}

const sendEmailProviderError = (res, error) => {
  const mapped = emailProviderError(error)
  return res.status(mapped.status).json({ error: mapped.message })
}

const emailRedirectUrl = () => {
  const configured = process.env.AUTH_REDIRECT_URL
  if (configured) return configured
  const firstClientOrigin = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim()
  return `${firstClientOrigin.replace(/\/$/, "")}/login?confirmed=1`
}

const issueAppToken = async (res, user, status = 200) => {
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" })
  return res.status(status).json({
    message: "Email расталды, аккаунт дайын",
    token,
    user: await clientUser(user),
  })
}

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

    const emailAuth = createEmailAuthClient()
    const { data, error } = await emailAuth.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: emailRedirectUrl(),
      },
    })
    if (error) return sendEmailProviderError(res, error)
    if (data.user?.identities?.length === 0) {
      const { error: resendError } = await emailAuth.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: emailRedirectUrl() },
      })
      if (resendError) return sendEmailProviderError(res, resendError)
      return res.status(202).json({
        message: "Email-ды растау сілтемесі жіберілді",
        requiresEmailVerification: true,
        email,
      })
    }
    if (data.session && data.user?.id) {
      // Email confirmation must stay enabled. Remove the unverified bypass account so a retry is safe.
      const { error: cleanupError } = await emailAuth.auth.admin.deleteUser(data.user.id)
      if (cleanupError) console.error("Unverified Supabase Auth user cleanup failed:", cleanupError.message)
      return res.status(503).json({ error: "Email растауы өшірулі тұр. Supabase Auth баптауынан email confirmation-ды қосыңыз." })
    }
    return res.status(202).json({
      message: "Email-ды растау сілтемесі жіберілді",
      requiresEmailVerification: true,
      email,
    })
  } catch (error) {
    console.error("Тіркелу қатесі:", error.message)
    return res.status(500).json({ error: "Сервер қатесі" })
  }
}

const resendRegistrationLink = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email } = req.body
    const emailAuth = createEmailAuthClient()
    const { error } = await emailAuth.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: emailRedirectUrl() },
    })
    if (error) return sendEmailProviderError(res, error)
    return res.json({ message: "Email-ды растау сілтемесі қайта жіберілді" })
  } catch (error) {
    console.error("Растау сілтемесін қайта жіберу қатесі:", error.message)
    return res.status(500).json({ error: "Сілтемені қайта жіберу кезінде сервер қатесі орын алды" })
  }
}

const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email, password } = req.body
    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id, full_name, email, avatar, password")
      .eq("email", email)
      .maybeSingle()
    if (lookupError) throw lookupError

    // Existing accounts use the application's password hash. A newly confirmed
    // Supabase user gets its app profile on first successful login.
    let user = existingUser
    if (user) {
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: "Қате email немесе құпия сөз" })
      }
    } else {
      const emailAuth = createEmailAuthClient()
      const { data: signedIn, error: signInError } = await emailAuth.auth.signInWithPassword({ email, password })
      if (signInError) {
        if (/email not confirmed/i.test(signInError.message || "")) {
          return res.status(403).json({ error: "Алдымен email-ға келген растау сілтемесін ашыңыз." })
        }
        return res.status(400).json({ error: "Қате email немесе құпия сөз" })
      }
      if (!signedIn.user?.email_confirmed_at) {
        return res.status(403).json({ error: "Алдымен email-ға келген растау сілтемесін ашыңыз." })
      }

      const fullName = String(signedIn.user.user_metadata?.full_name || email.split("@")[0]).slice(0, 255)
      const hashedPassword = await bcrypt.hash(password, 12)
      const { data: createdUser, error: createError } = await supabase
        .from("users")
        .insert({ full_name: fullName, email, password: hashedPassword })
        .select("id, full_name, email, avatar, password")
        .single()
      if (createError) {
        if (createError.code === "23505") {
          const { data: racedUser, error: raceError } = await supabase
            .from("users")
            .select("id, full_name, email, avatar, password")
            .eq("email", email)
            .maybeSingle()
          if (raceError) throw raceError
          if (!racedUser || !(await bcrypt.compare(password, racedUser.password))) {
            return res.status(409).json({ error: "Бұл email мекенжайы бұрын тіркелген." })
          }
          user = racedUser
        } else {
          throw createError
        }
      } else {
        user = createdUser
      }
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" })
    return res.json({
      message: "Сәтті кірілді",
      token,
      user: await clientUser(user),
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
    return res.json({ user: await clientUser(user) })
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
      user: await clientUser(user),
    })
  } catch (error) {
    console.error("Профиль жаңарту қатесі:", error.message)
    return res.status(500).json({ error: "Сервер қатесі" })
  }
}

const uploadAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Профиль суретін таңдаңыз" })

  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" })[req.file.mimetype]
  const objectPath = `avatars/${req.user.id}/${randomUUID()}.${extension}`
  let uploaded = false

  try {
    await uploadImage(objectPath, req.file)
    uploaded = true

    const { data: user, error } = await supabase
      .from("users")
      .update({ avatar: objectPath, updated_at: new Date().toISOString() })
      .eq("id", req.user.id)
      .select("id, full_name, email, avatar")
      .maybeSingle()
    if (error) throw error
    if (!user) {
      await deleteImage(objectPath).catch(() => {})
      return res.status(404).json({ error: "Қолданушы табылмады" })
    }

    const signedAvatar = await avatarUrl(user.avatar)
    const previousAvatar = req.user.avatar
    if (previousAvatar?.startsWith("avatars/") && previousAvatar !== objectPath) {
      deleteImage(previousAvatar).catch((error) => console.error("Ескі профиль суретін өшіру қатесі:", error.message))
    }

    return res.json({ message: "Профиль суреті сақталды", user: { ...await clientUser(user), avatar: signedAvatar } })
  } catch (error) {
    if (uploaded) await deleteImage(objectPath).catch(() => {})
    console.error("Профиль суретін сақтау қатесі:", error.message)
    return res.status(500).json({ error: "Профиль суретін сақтау мүмкін болмады" })
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

module.exports = { register, resendRegistrationLink, login, getProfile, updateProfile, uploadAvatar, changePassword }
