import axios from "axios"

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "")

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 секунд
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  register: (fullName, email, password) => {
    return api.post("/auth/register", { fullName, email, password })
  },

  login: (email, password) => {
    return api.post("/auth/login", { email, password })
  },

  getProfile: () => {
    return api.get("/auth/profile")
  },

  updateProfile: (profileData) => {
    return api.put("/auth/profile", profileData)
  },

  changePassword: (currentPassword, newPassword) => {
    return api.put("/auth/change-password", { currentPassword, newPassword })
  },
}

// Plants API - ЖАҢАРТЫЛҒАН
export const plantsAPI = {
  // Өсімдікті сканерлеу
  identifyPlant: (imageFile) => {
    const formData = new FormData()
    formData.append("plantImage", imageFile)

    return api.post("/plants/identify", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 секунд (AI үшін көп уақыт керек)
    })
  },

  // Сканерлеу тарихы
  getUserScans: (page = 1, limit = 10) => {
    return api.get(`/plants/scans?page=${page}&limit=${limit}`)
  },

  // Сканерлеуді өшіру
  deleteScan: (id) => {
    return api.delete(`/plants/scans/${id}`)
  },

  // Статистика
  getUserStats: () => {
    return api.get("/plants/stats")
  },

  // Бір сканерлеуді алу
  getScanById: (id) => {
    return api.get(`/plants/scans/${id}`)
  },
}

export default api
