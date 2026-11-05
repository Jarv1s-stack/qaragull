"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "../services/api"

const GUEST_MODE_KEY = "qaragull.guestMode"
const GUEST_NAME_KEY = "qaragull.guestName"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth хукы AuthProvider ішінде қолданылуы керек")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [isGuest, setIsGuest] = useState(localStorage.getItem(GUEST_MODE_KEY) === "1")

  useEffect(() => {
    const initAuth = async () => {
      if (localStorage.getItem(GUEST_MODE_KEY) === "1") {
        setUser({ id: "guest", fullName: localStorage.getItem(GUEST_NAME_KEY) || "Қонақ зерттеуші", email: "", isGuest: true })
        setToken(null)
        setIsGuest(true)
        setLoading(false)
        return
      }

      const savedToken = localStorage.getItem("token")
      if (savedToken) {
        try {
          const response = await authAPI.getProfile()
          setUser(response.data.user)
          setToken(savedToken)
        } catch {
          localStorage.removeItem("token")
          setToken(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const { token: newToken, user: userData } = response.data

      setToken(newToken)
      setUser(userData)
      setIsGuest(false)
      localStorage.removeItem(GUEST_MODE_KEY)
      localStorage.setItem("token", newToken)

      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Кіру кезінде қате орын алды"
      return { success: false, error: errorMessage }
    }
  }

  const register = async (fullName, email, password) => {
    try {
      const response = await authAPI.register(fullName, email, password)
      const { token: newToken, user: userData, requiresEmailVerification } = response.data
      localStorage.removeItem(GUEST_MODE_KEY)
      setIsGuest(false)

      if (requiresEmailVerification) {
        setUser(null)
        return { success: true, requiresEmailVerification: true }
      }

      setToken(newToken)
      setUser(userData)
      setIsGuest(false)
      localStorage.removeItem(GUEST_MODE_KEY)
      localStorage.setItem("token", newToken)

      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Тіркелу кезінде қате орын алды"
      return { success: false, error: errorMessage }
    }
  }

  const resendRegistrationLink = async (email) => {
    try {
      await authAPI.resendRegistrationLink(email)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Растау сілтемесін қайта жіберу кезінде қате орын алды"
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
    localStorage.removeItem(GUEST_MODE_KEY)
    localStorage.removeItem(GUEST_NAME_KEY)
    setIsGuest(false)
  }

  const enterGuestMode = () => {
    localStorage.removeItem("token")
    localStorage.setItem(GUEST_MODE_KEY, "1")
    setToken(null)
    setUser({ id: "guest", fullName: localStorage.getItem(GUEST_NAME_KEY) || "Қонақ зерттеуші", email: "", isGuest: true })
    setIsGuest(true)
  }

  const updateProfile = async (profileData) => {
    if (isGuest) {
      const guestUser = { ...user, fullName: profileData.fullName }
      setUser(guestUser)
      localStorage.setItem(GUEST_NAME_KEY, profileData.fullName)
      return { success: true, user: guestUser }
    }
    try {
      const response = await authAPI.updateProfile(profileData)
      setUser(response.data.user)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Профиль жаңарту кезінде қате орын алды"
      return { success: false, error: errorMessage }
    }
  }

  const uploadAvatar = async (file) => {
    if (isGuest) return { success: false, error: "Профиль суретін сақтау үшін аккаунтқа кіріңіз." }
    try {
      const response = await authAPI.uploadAvatar(file)
      setUser(response.data.user)
      return { success: true, user: response.data.user }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Профиль суретін сақтау кезінде қате орын алды"
      return { success: false, error: errorMessage }
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    if (isGuest) return { success: false, error: "Құпия сөзді басқару үшін аккаунт қажет." }
    try {
      await authAPI.changePassword(currentPassword, newPassword)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Құпия сөз өзгерту кезінде қате орын алды"
      return { success: false, error: errorMessage }
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    enterGuestMode,
    resendRegistrationLink,
    logout,
    updateProfile,
    uploadAvatar,
    changePassword,
    isGuest,
    isAuthenticated: !!token || isGuest,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
