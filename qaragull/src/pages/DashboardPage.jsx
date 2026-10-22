"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { plantsAPI } from "../services/api"
import Navbar from "../components/Navbar"
import { Camera, History, User, Leaf, Scan, TrendingUp, Clock, Star, Award, Target, Zap, Calendar } from "lucide-react"

const DashboardPage = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalScans: 0,
    thisWeek: 0,
    avgAccuracy: 0,
    uniqueSpecies: 0,
  })
  const [recentScans, setRecentScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting("Қайырлы таң")
    } else if (hour < 18) {
      setGreeting("Қайырлы күн")
    } else {
      setGreeting("Қайырлы кеш")
    }

    const fetchData = async () => {
      try {
        const [statsResponse, scansResponse] = await Promise.all([
          plantsAPI.getUserStats(),
          plantsAPI.getUserScans(1, 3),
        ])

        setStats(statsResponse.data.stats)
        setRecentScans(scansResponse.data.scans)
      } catch {
        setStats({ totalScans: 0, thisWeek: 0, avgAccuracy: 0, uniqueSpecies: 0 })
        setRecentScans([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Жаңа ғана"
    if (diffInHours < 24) return `${diffInHours} сағат бұрын`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return "Кеше"
    if (diffInDays < 7) return `${diffInDays} күн бұрын`

    return date.toLocaleDateString("kk-KZ")
  }

  const getMotivationalMessage = () => {
    if (stats.totalScans === 0) {
      return "Алғашқы өсімдікті сканерлеп, саяхатыңызды бастаңыз! 🌱"
    } else if (stats.totalScans < 10) {
      return "Керемет бастама! Жаңа өсімдіктерді зерттеуді жалғастырыңыз! 🌿"
    } else if (stats.totalScans < 50) {
      return "Сіз нағыз өсімдік сарапшысы болып келесіз! 🌳"
    } else {
      return "Сіз PlantID шебері! Өз білімдеріңізбен бөлісіңіз! 🏆"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                {greeting}, {user?.fullName}! 👋
              </h1>
              <p className="text-gray-600 text-lg">{getMotivationalMessage()}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Соңғы кіру</p>
                <p className="text-sm font-medium text-gray-700">{new Date().toLocaleDateString("kk-KZ")}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-green-600">{user?.fullName?.charAt(0)?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white border-0 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Жалпы сканерлеу</p>
                <p className="text-3xl font-bold">{stats.totalScans}</p>
                <p className="text-green-200 text-xs mt-1">
                  {stats.totalScans > 0 ? "+2 осы аптада" : "Бастау үшін сканерлеңіз"}
                </p>
              </div>
              <div className="relative">
                <Scan className="w-12 h-12 text-green-200" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-green-800">!</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Осы аптада</p>
                <p className="text-3xl font-bold">{stats.thisWeek}</p>
                <p className="text-blue-200 text-xs mt-1">
                  {stats.thisWeek > 0 ? "Белсенді аптаңыз!" : "Жаңа аптаны бастаңыз"}
                </p>
              </div>
              <Clock className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">AI сенімділік бағасының орташа мәні</p>
                <p className="text-3xl font-bold">
                  {stats.totalScans && stats.avgAccuracy != null ? `${stats.avgAccuracy}%` : "—"}
                </p>
                <p className="text-purple-200 text-xs mt-1">
                  AI бағасы, өлшенген дәлдік емес
                </p>
              </div>
              <div className="relative">
                <Star className="w-12 h-12 text-purple-200" />
                {stats.avgAccuracy >= 95 && <Award className="w-6 h-6 text-yellow-300 absolute -top-1 -right-1" />}
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Түрлі өсімдік</p>
                <p className="text-3xl font-bold">{stats.uniqueSpecies}</p>
                <p className="text-orange-200 text-xs mt-1">
                  {stats.uniqueSpecies >= 20 ? "Коллекционер!" : "Коллекцияңызды кеңейтіңіз"}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link to="/scan" className="group">
            <div className="card hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md group-hover:scale-105 bg-gradient-to-br from-green-50 to-green-100">
              <div className="p-6 text-center">
                <div className="relative mb-4">
                  <Camera className="w-16 h-16 text-green-600 mx-auto group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">🌿 Жаңа сканерлеу</h3>
                <p className="text-gray-600">Өсімдіктің суретін түсіріп анықтаңыз</p>
                <div className="mt-3 text-sm text-green-600 font-medium">Дәл қазір сканерлеу →</div>
              </div>
            </div>
          </Link>

          <Link to="/history" className="group">
            <div className="card hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md group-hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="p-6 text-center">
                <History className="w-16 h-16 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">📚 Тарих қарау</h3>
                <p className="text-gray-600">Бұрын сканерленген өсімдіктер</p>
                <div className="mt-3 text-sm text-blue-600 font-medium">{stats.totalScans} сканерлеу →</div>
              </div>
            </div>
          </Link>

          <Link to="/profile" className="group">
            <div className="card hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md group-hover:scale-105 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="p-6 text-center">
                <User className="w-16 h-16 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">👤 Профиль</h3>
                <p className="text-gray-600">Жеке ақпараттарды басқару</p>
                <div className="mt-3 text-sm text-purple-600 font-medium">Профильді өзгерту →</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Enhanced Recent Activity */}
        <div className="card border-0 shadow-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold">Соңғы белсенділік</h2>
              </div>
              {recentScans.length > 0 && (
                <Link to="/history">
                  <button className="text-sm text-green-600 hover:text-green-700 font-medium">Барлығын қарау →</button>
                </Link>
              )}
            </div>
            <p className="text-gray-600 mb-6">Жақында сканерленген өсімдіктер</p>

            {recentScans.length > 0 ? (
              <div className="space-y-4">
                {recentScans.map((scan, index) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={scan.imageUrl || "/placeholder.svg"}
                          alt={scan.commonName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{scan.commonName}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(scan.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-medium text-green-600">{scan.accuracy == null ? "—" : `${scan.accuracy}%`}</p>
                      </div>
                      <p className="text-xs text-gray-500">AI бағасы</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative mb-4">
                  <Leaf className="w-20 h-20 text-gray-300 mx-auto" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl">+</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Әлі сканерлеу жоқ</h3>
                <p className="text-gray-500 mb-6">Алғашқы өсімдікті сканерлеп, саяхатыңызды бастаңыз!</p>
                <Link to="/scan">
                  <button className="btn btn-primary inline-flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Алғашқы сканерлеу
                  </button>
                </Link>
              </div>
            )}

            {recentScans.length > 0 && (
              <div className="mt-6 text-center">
                <Link to="/history">
                  <button className="btn btn-secondary w-full">
                    <History className="w-4 h-4 mr-2" />
                    Барлық тарихты қарау ({stats.totalScans})
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Achievement Section */}
        {stats.totalScans > 0 && (
          <div className="card border-0 shadow-lg mt-8">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-semibold">Жетістіктер</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  className={`text-center p-4 rounded-lg ${stats.totalScans >= 1 ? "bg-green-50 border-2 border-green-200" : "bg-gray-50"}`}
                >
                  <div className="text-2xl mb-2">🌱</div>
                  <p className="text-sm font-medium">Бастаушы</p>
                  <p className="text-xs text-gray-600">1+ сканерлеу</p>
                </div>
                <div
                  className={`text-center p-4 rounded-lg ${stats.totalScans >= 10 ? "bg-green-50 border-2 border-green-200" : "bg-gray-50"}`}
                >
                  <div className="text-2xl mb-2">🌿</div>
                  <p className="text-sm font-medium">Зерттеуші</p>
                  <p className="text-xs text-gray-600">10+ сканерлеу</p>
                </div>
                <div
                  className={`text-center p-4 rounded-lg ${stats.totalScans >= 50 ? "bg-green-50 border-2 border-green-200" : "bg-gray-50"}`}
                >
                  <div className="text-2xl mb-2">🌳</div>
                  <p className="text-sm font-medium">Сарапшы</p>
                  <p className="text-xs text-gray-600">50+ сканерлеу</p>
                </div>
                <div
                  className={`text-center p-4 rounded-lg ${stats.totalScans >= 100 ? "bg-green-50 border-2 border-green-200" : "bg-gray-50"}`}
                >
                  <div className="text-2xl mb-2">🏆</div>
                  <p className="text-sm font-medium">Шебер</p>
                  <p className="text-xs text-gray-600">100+ сканерлеу</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardPage
