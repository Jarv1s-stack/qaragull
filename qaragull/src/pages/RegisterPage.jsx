import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { ArrowLeft, Eye, EyeOff, Leaf, Lock, Mail, User } from "lucide-react"

const RegisterPage = () => {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", confirmPassword: "" })
  const [stage, setStage] = useState("details")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { register, resendRegistrationLink } = useAuth()
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    if (errors[name] || errors.general) setErrors((current) => ({ ...current, [name]: "", general: "" }))
  }

  const validateForm = () => {
    const nextErrors = {}
    if (formData.fullName.trim().length < 2) nextErrors.fullName = "Толық аты кемінде 2 таңбадан тұруы керек"
    if (!/\S+@\S+\.\S+/.test(formData.email.trim())) nextErrors.email = "Дұрыс email мекенжайын енгізіңіз"
    if (formData.password.length < 6) nextErrors.password = "Құпия сөз кемінде 6 таңбадан тұруы керек"
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "Құпия сөздер сәйкес келмейді"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})
    setNotice("")
    const result = await register(formData.fullName.trim(), formData.email.trim(), formData.password)
    if (!result.success) {
      setErrors({ general: result.error })
    } else if (result.requiresEmailVerification) {
      setStage("sent")
      setNotice("Email-ға растау сілтемесі жіберілді. Хаттағы сілтемені ашып, аккаунтты растаңыз. Хат көрінбесе, Spam бумасын тексеріңіз.")
    } else {
      navigate("/dashboard")
    }
    setIsLoading(false)
  }

  const handleResend = async () => {
    setIsLoading(true)
    setErrors({})
    setNotice("")
    const result = await resendRegistrationLink(formData.email.trim())
    if (result.success) setNotice("Жаңа растау сілтемесі жіберілді. Email мен Spam бумасын тексеріңіз.")
    else setErrors({ general: result.error })
    setIsLoading(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-layout" aria-labelledby="register-title">
        <div className="auth-form-column">
          <Link to="/" className="brand-lockup auth-brand-lockup">
            <span className="brand-symbol"><Leaf size={19} aria-hidden="true" /></span>
            <span>Qaragull<small>ӨСІМДІК АТЛАСЫ</small></span>
          </Link>

          <header className="auth-brand-head">
            <Link to="/" className="auth-back-link"><ArrowLeft size={15} aria-hidden="true" /> Басты бетке</Link>
            <p className="eyebrow">ЖЕКЕ ДАЛАЛЫҚ ДӘПТЕРІҢ</p>
            <h1 id="register-title">{stage === "sent" ? "Email-ды растаңыз" : "Тіркелу"}</h1>
            <p>{stage === "sent" ? "Аккаунтты іске қосу үшін поштаңыздағы сілтемені ашыңыз." : "Өсімдіктерді танып, бақылау тарихын сақтаңыз."}</p>
          </header>

          <div className="auth-form-content">
            {errors.general && <div className="auth-message auth-message-error" role="alert">{errors.general}</div>}
            {notice && <div className="auth-message auth-message-success" role="status">{notice}</div>}

            {stage === "details" ? (
              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="auth-field">
                  <label htmlFor="fullName">Толық аты</label>
                  <div className="auth-input-wrap">
                    <User size={17} aria-hidden="true" />
                    <input id="fullName" name="fullName" type="text" autoComplete="name" required maxLength={100} placeholder="Атыңыз бен тегіңіз" value={formData.fullName} onChange={handleChange} aria-invalid={Boolean(errors.fullName)} />
                  </div>
                  {errors.fullName && <p className="auth-field-error">{errors.fullName}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="email">Email</label>
                  <div className="auth-input-wrap">
                    <Mail size={17} aria-hidden="true" />
                    <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@example.com" value={formData.email} onChange={handleChange} aria-invalid={Boolean(errors.email)} />
                  </div>
                  {errors.email && <p className="auth-field-error">{errors.email}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="password">Құпия сөз</label>
                  <div className="auth-input-wrap">
                    <Lock size={17} aria-hidden="true" />
                    <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={6} placeholder="Кемінде 6 таңба" value={formData.password} onChange={handleChange} aria-invalid={Boolean(errors.password)} />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Құпия сөзді жасыру" : "Құпия сөзді көрсету"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </div>
                  {errors.password && <p className="auth-field-error">{errors.password}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="confirmPassword">Құпия сөзді қайталаңыз</label>
                  <div className="auth-input-wrap">
                    <Lock size={17} aria-hidden="true" />
                    <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required minLength={6} placeholder="Құпия сөзді қайталаңыз" value={formData.confirmPassword} onChange={handleChange} aria-invalid={Boolean(errors.confirmPassword)} />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Құпия сөзді жасыру" : "Құпия сөзді көрсету"} aria-pressed={showConfirmPassword}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </div>
                  {errors.confirmPassword && <p className="auth-field-error">{errors.confirmPassword}</p>}
                </div>

                <button type="submit" disabled={isLoading} className="btn btn-primary auth-submit">{isLoading ? "Тіркеліп жатыр…" : "Тіркелу"}</button>
              </form>
            ) : (
              <div className="auth-form">
                <div className="auth-email-target"><Mail size={17} aria-hidden="true" /><span>{formData.email}</span></div>
                <div className="auth-code-actions">
                  <button type="button" className="auth-text-button" disabled={isLoading} onClick={handleResend}>{isLoading ? "Жіберілуде…" : "Сілтемені қайта жіберу"}</button>
                  <button type="button" className="auth-text-button" disabled={isLoading} onClick={() => { setStage("details"); setErrors({}); setNotice("") }}>Басқа email енгізу</button>
                </div>
                <Link to="/login" className="btn btn-primary auth-submit">Email-ды растаған соң кіру</Link>
              </div>
            )}

            <p className="auth-login-link">Аккаунтыңыз бар ма? <Link to="/login">Кіру</Link></p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default RegisterPage
