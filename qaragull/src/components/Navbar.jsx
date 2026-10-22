"use client"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Leaf, Menu, X, User, LogOut } from "lucide-react"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-800">PlantID</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                isActive("/dashboard")
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-600 hover:text-primary-600 hover:bg-gray-100"
              }`}
            >
              Басты бет
            </Link>
            <Link
              to="/scan"
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                isActive("/scan")
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-600 hover:text-primary-600 hover:bg-gray-100"
              }`}
            >
              Сканерлеу
            </Link>
            <Link
              to="/history"
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                isActive("/history")
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-600 hover:text-primary-600 hover:bg-gray-100"
              }`}
            >
              Тарих
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600">{user?.fullName}</span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Профиль
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 inline mr-2" />
                    Шығу
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col gap-2">
              <Link
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-600 hover:text-primary-600 hover:bg-gray-100"
                }`}
              >
                Басты бет
              </Link>
              <Link
                to="/scan"
                onClick={() => setIsMenuOpen(false)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive("/scan")
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-600 hover:text-primary-600 hover:bg-gray-100"
                }`}
              >
                Сканерлеу
              </Link>
              <Link
                to="/history"
                onClick={() => setIsMenuOpen(false)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive("/history")
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-600 hover:text-primary-600 hover:bg-gray-100"
                }`}
              >
                Тарих
              </Link>
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive("/profile")
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-600 hover:text-primary-600 hover:bg-gray-100"
                }`}
              >
                Профиль
              </Link>
              <button
                onClick={handleLogout}
                className="text-left px-3 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Шығу
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for profile dropdown */}
      {isProfileOpen && <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />}
    </nav>
  )
}

export default Navbar
