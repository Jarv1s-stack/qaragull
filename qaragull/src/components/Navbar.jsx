import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Camera, FlaskConical, Leaf, LogOut, Menu, Sprout, UserRound, X } from "lucide-react"

const links = [
  { to: "/dashboard", label: "Шолу", icon: Sprout },
  { to: "/scan", label: "Тану", icon: Camera },
  { to: "/history", label: "Жинақ", icon: Leaf },
  { to: "/lab", label: "Зертхана", icon: FlaskConical },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout, isGuest } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/dashboard" className="brand-lockup" aria-label="Qaragull — шолу">
          <img className="brand-symbol" src="/mitu-logo.png" alt="" />
          <span>Qaragull<small>ӨСІМДІК АТЛАСЫ</small></span>
        </Link>
        <nav className={"app-nav" + (menuOpen ? " is-open" : "")} aria-label="Жеке кабинет">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} aria-current={location.pathname === to ? "page" : undefined} className={location.pathname === to ? "active" : ""} onClick={() => setMenuOpen(false)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </Link>
          ))}
          <Link to="/profile" className={"app-mobile-account-link" + (location.pathname === "/profile" ? " active" : "")} aria-current={location.pathname === "/profile" ? "page" : undefined} onClick={() => setMenuOpen(false)}>
            <UserRound size={17} strokeWidth={1.8} /><span>Профиль</span>
          </Link>
          <button type="button" className="app-mobile-logout" onClick={() => { setMenuOpen(false); handleLogout() }}>
            <LogOut size={17} strokeWidth={1.8} /><span>Шығу</span>
          </button>
        </nav>
        <div className="app-account">
          <Link to="/profile" className="account-profile" aria-label="Профиль">
            <span className="account-avatar">{user?.avatar ? <img src={user.avatar} alt="" /> : <UserRound size={16} />}</span>
            <span className="account-name">{isGuest ? "Қонақ" : user?.fullName || "Зерттеуші"}</span>
          </Link>
          <button type="button" className="logout-button" onClick={handleLogout} aria-label={isGuest ? "Қонақ режимінен шығу" : "Аккаунттан шығу"} title={isGuest ? "Қонақ режимінен шығу" : "Шығу"}><LogOut size={17} /></button>
        </div>
        <button type="button" className="menu-toggle app-menu-toggle" aria-label={menuOpen ? "Мәзірді жабу" : "Мәзірді ашу"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </header>
  )
}
