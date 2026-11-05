import axios from "axios"
import { guestStore, isGuestSession } from "./guestStore"

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
  identifyPlant: async (imageFile) => {
    const formData = new FormData()
    formData.append("plantImage", imageFile)

    const result = await api.post(isGuestSession() ? "/plants/identify-guest" : "/plants/identify", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 секунд (AI үшін көп уақыт керек)
    })
    if (isGuestSession() && result.data?.scan) {
      const scan = { ...result.data.scan, imageUrl: await makeGuestThumbnail(imageFile) }
      guestStore.addScan(scan)
      result.data.scan = scan
    }
    return result
  },

  // Сканерлеу тарихы
  getUserScans: (page = 1, limit = 10) => {
    if (isGuestSession()) return guestStore.getScans(page, limit)
    return api.get(`/plants/scans?page=${page}&limit=${limit}`)
  },

  // Сканерлеуді өшіру
  deleteScan: (id) => {
    if (isGuestSession()) return guestStore.deleteScan(id)
    return api.delete(`/plants/scans/${id}`)
  },

  // Статистика
  getUserStats: () => {
    if (isGuestSession()) return guestStore.getStats()
    return api.get("/plants/stats")
  },

  // Бір сканерлеуді алу
  getScanById: (id) => {
    if (isGuestSession()) return guestStore.getScan(id)
    return api.get(`/plants/scans/${id}`)
  },
  refineDiagnosis: (id, answer) => isGuestSession()
    ? Promise.reject({ response: { data: { error: "Қосымша AI сұрағы аккаунтпен қолжетімді." } } })
    : api.post(`/plants/scans/${id}/follow-up`, { answer }, { timeout: 30000 }),
}

export const labAPI = {
  getProfiles: () => isGuestSession() ? guestStore.getProfiles() : api.get("/lab/profiles"),
  createProfile: (data) => isGuestSession() ? guestStore.createProfile(data) : api.post("/lab/profiles", data),
  getCareEvents: (profileId) => isGuestSession() ? guestStore.getCareEvents(profileId) : api.get(`/lab/care-events?profileId=${encodeURIComponent(profileId)}`),
  createCareEvent: (data) => isGuestSession() ? guestStore.createCareEvent(data) : api.post("/lab/care-events", data),
  getReadings: () => isGuestSession() ? guestStore.getReadings() : api.get("/lab/readings"),
  createReading: (data) => isGuestSession() ? guestStore.createReading(data) : api.post("/lab/readings", data),
  getExperiments: () => isGuestSession() ? guestStore.getExperiments() : api.get("/lab/experiments"),
  createExperiment: (data) => isGuestSession() ? guestStore.createExperiment(data) : api.post("/lab/experiments", data),
  createMeasurement: (data) => isGuestSession() ? guestStore.createMeasurement(data) : api.post("/lab/measurements", data),
  getCommunity: () => isGuestSession() ? guestStore.getCommunity() : api.get("/lab/community"),
  createCommunityObservation: (data) => isGuestSession() ? guestStore.createCommunityObservation(data) : api.post("/lab/community", data),
  requestExpertReview: (data) => isGuestSession() ? guestStore.requestExpertReview(data) : api.post("/lab/expert-review", data),
}

const makeGuestThumbnail = (file) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = () => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, 480 / Math.max(image.width, image.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", 0.55))
    }
    image.onerror = () => resolve("")
    image.src = String(reader.result || "")
  }
  reader.onerror = () => resolve("")
  reader.readAsDataURL(file)
})

export default api
