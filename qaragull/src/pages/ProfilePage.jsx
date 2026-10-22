"use client"

import { useState, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import { User, Mail, Lock, Camera, Eye, EyeOff, Save, Leaf } from "lucide-react"

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const fileInputRef = useRef(null)

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateProfile = () => {
    const newErrors = {}

    if (!profileData.fullName.trim()) {
      newErrors.fullName = "Толық атыңызды енгізіңіз"
    }

    if (!profileData.email.trim()) {
      newErrors.email = "Email мекенжайын енгізіңіз"
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = "Дұрыс email мекенжайын енгізіңіз"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePassword = () => {
    const newErrors = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Ағымдағы құпия сөзді енгізіңіз"
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "Жаңа құпия сөзді енгізіңіз"
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Құпия сөз кемінде 6 таңбадан тұруы керек"
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Құпия сөздер сәйкес келмейді"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()

    if (!validateProfile()) return

    setIsLoading(true)
    setErrors({})

    try {
      const result = await updateProfile(profileData)
      if (result.success) {
        setSuccessMessage("Профиль сәтті жаңартылды!")
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: "Профильді жаңарту кезінде қате орын алды" })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!validatePassword()) return

    setIsLoading(true)
    setErrors({})

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword)
      if (result.success) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        setSuccessMessage("Құпия сөз сәтті өзгертілді!")
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: "Құпия сөзді өзгерту кезінде қате орын алды" })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
            <p className="text-green-600 text-sm">{successMessage}</p>
          </div>
        )}

        <div className="card border-0 shadow-lg">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 pt-6">
              <button
                onClick={() => setActiveTab("profile")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "profile"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Жеке ақпарат
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "password"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Құпия сөз
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "profile" && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Жеке ақпарат</h2>
                <p className="text-gray-600 mb-6">Өз ақпараттарыңызды басқарыңыз</p>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm">{errors.general}</p>
                    </div>
                  )}

                  {/* Avatar Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-600">
                        {user?.fullName?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-center">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary">
                        <Camera className="w-4 h-4 mr-2" />
                        Сурет өзгерту
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Толық аты
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          required
                          placeholder="Атыңыз мен тегіңіз"
                          value={profileData.fullName}
                          onChange={handleProfileChange}
                          className={`input pl-10 ${errors.fullName ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="example@email.com"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          className={`input pl-10 ${errors.email ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                    {isLoading ? (
                      "Сақталуда..."
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Өзгерістерді сақтау
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {activeTab === "password" && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Құпия сөзді өзгерту</h2>
                <p className="text-gray-600 mb-6">Аккаунтыңыздың қауіпсіздігі үшін күшті құпия сөз қолданыңыз</p>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm">{errors.general}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Ағымдағы құпия сөз
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        required
                        placeholder="Ағымдағы құпия сөзіңіз"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`input pl-10 pr-10 ${errors.currentPassword ? "border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.currentPassword && <p className="text-sm text-red-600">{errors.currentPassword}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      Жаңа құпия сөз
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        required
                        placeholder="Жаңа құпия сөзіңіз"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`input pl-10 pr-10 ${errors.newPassword ? "border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("new")}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Жаңа құпия сөзді растау
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        required
                        placeholder="Жаңа құпия сөзді қайталаңыз"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`input pl-10 pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("confirm")}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>

                  <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                    {isLoading ? (
                      "Өзгертілуде..."
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Құпия сөзді өзгерту
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Account Stats */}
        <div className="card border-0 shadow-lg mt-8">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold">Аккаунт статистикасы</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">24</p>
                <p className="text-sm text-gray-600">Жалпы сканерлеу</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">7</p>
                <p className="text-sm text-gray-600">Осы аптада</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">95%</p>
                <p className="text-sm text-gray-600">Орташа дәлдік</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">15</p>
                <p className="text-sm text-gray-600">Түрлі өсімдік</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
