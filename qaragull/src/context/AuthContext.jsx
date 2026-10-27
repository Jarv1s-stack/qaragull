"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "../services/api"

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

  useEffect(() => {
    const initAuth = async () => {
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
      const { token: newToken, user: userData } = response.data

      setToken(newToken)
      setUser(userData)
      localStorage.setItem("token", newToken)

      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Тіркелу кезінде қате орын алды"
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
  }

  const updateProfile = async (profileData) => {
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
    logout,
    updateProfile,
    uploadAvatar,
    changePassword,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
