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

  resendRegistrationLink: (email) => {
    return api.post("/auth/resend-registration-link", { email })
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

  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append("avatar", file)
    return api.post("/auth/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } })
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
  refineDiagnosis: (id, answer) => api.post(`/plants/scans/${id}/follow-up`, { answer }, { timeout: 30000 }),
}

export const labAPI = {
  getProfiles: () => api.get("/lab/profiles"),
  createProfile: (data) => api.post("/lab/profiles", data),
  getCareEvents: (profileId) => api.get(`/lab/care-events?profileId=${encodeURIComponent(profileId)}`),
  createCareEvent: (data) => api.post("/lab/care-events", data),
  getReadings: () => api.get("/lab/readings"),
  createReading: (data) => api.post("/lab/readings", data),
  getExperiments: () => api.get("/lab/experiments"),
  createExperiment: (data) => api.post("/lab/experiments", data),
  createMeasurement: (data) => api.post("/lab/measurements", data),
  getCommunity: () => api.get("/lab/community"),
  createCommunityObservation: (data) => api.post("/lab/community", data),
  requestExpertReview: (data) => api.post("/lab/expert-review", data),
}

export default api
