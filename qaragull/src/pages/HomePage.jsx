import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowDown, ArrowRight, ArrowUpRight, Camera, ChevronDown, Leaf, Map, Menu, Microscope, ShieldCheck, Sprout, X } from "lucide-react"

const features = [
  { number: "01", icon: Camera, title: "Түрді дәлелде", text: "Арнайы өсімдік тану жүйесі ең ықтимал үш түрді және сәйкестік деңгейін көрсетеді.", to: "/register", tone: "feature-fern" },
  { number: "02", icon: Microscope, title: "Белгіні зертте", text: "Жапырақтағы өзгерістерді талдап, ықтимал себептер мен қауіпсіз келесі қадамдарды ұсынады.", to: "/register", tone: "feature-cream" },
  { number: "03", icon: Map, title: "Флораны картаға түсір", text: "Қазақстан табиғаты бойынша ашық бақылауларды көріп, жеке белгіңді картаға қоса аласың.", to: "/register", tone: "feature-blue" },
]

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="site-home">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand-lockup" to="/" aria-label="Qaragull — басты бет">
            <img className="brand-symbol" src="/mitu-logo.png" alt="" />
            <span>Qaragull<small>ӨСІМДІК АТЛАСЫ</small></span>
          </Link>
          <nav className={"site-nav" + (menuOpen ? " is-open" : "")} aria-label="Негізгі навигация">
            <a href="#features" onClick={closeMenu}>Мүмкіндіктер</a>
            <a href="#method" onClick={closeMenu}>Қалай жұмыс істейді</a>
            <a href="#about" onClick={closeMenu}>Жоба туралы</a>
            <Link className="mobile-nav-link" to="/login" onClick={closeMenu}>Кіру</Link>
            <Link className="mobile-nav-cta" to="/register" onClick={closeMenu}>Тегін бастау <ArrowUpRight size={16} /></Link>
          </nav>
          <div className="site-header-actions">
            <Link className="site-login" to="/login">Кіру</Link>
            <Link className="button button-dark button-small" to="/register">Тегін бастау <ArrowUpRight size={15} /></Link>
          </div>
          <button className="menu-toggle" type="button" aria-label={menuOpen ? "Мәзірді жабу" : "Мәзірді ашу"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main>
        <section className="home-hero">
          <div className="hero-copy">
            <p className="eyebrow"><span /> ДАЛА ДӘПТЕРІ · № 001</p>
            <h1>Әр жапырақта<br />бір <em>әлем</em> бар.</h1>
            <p className="hero-intro">Қазақстан флорасын таны, бақыла және зертте. Qaragull — табиғатқа мұқият қарауға арналған цифрлық далалық дәптер.</p>
            <div className="hero-actions">
              <Link to="/register" className="button button-dark">Өсімдікті таны <ArrowRight size={17} /></Link>
              <Link to="/login" className="text-link">Қонақ ретінде көру</Link>
              <a href="#features" className="text-link">Зерттеу <ArrowDown size={15} /></a>
            </div>
            <div className="hero-proof">
              <div className="proof-avatars" aria-hidden="true"><span>Q</span><span>Ө</span><span>🌱</span></div>
              <p><strong>Ашық білімге негізделген</strong><br />Өсімдік тану · дала бақылауы · күтім тарихы</p>
            </div>
          </div>
          <div className="hero-specimen">
            <div className="specimen-top"><span><i /> ЖҮЙЕ ДАЙЫН</span><span>BOTANICA / 01</span></div>
            <div className="specimen-caption"><span>FIELD STUDY</span><span>43° 14′ N&nbsp; · &nbsp;76° 56′ E</span></div>
            <div className="specimen-label"><span>Flora of Kazakhstan<small>Бақылау арқылы табиғатты түсіну</small></span></div>
          </div>
          <div className="hero-index" aria-hidden="true">QG—01</div>
        </section>

        <section id="features" className="features-section">
          <div className="section-heading">
            <div><p className="eyebrow">БІР ҚОЛДАНБА · КӨП МҮМКІНДІК</p><h2>Қызығушылықтан<br /><em>зерттеуге дейін.</em></h2></div>
            <p className="section-intro">Суретті жүкте. Белгілерді бақыла. Табиғатпен байланысыңды уақыт өте толықтыр.</p>
          </div>
          <div className="feature-grid">
            {features.map(({ number, icon: Icon, title, text, to, tone }) => (
              <Link className={"feature-card " + tone} to={to} key={number}>
                <div className="feature-card-top"><span>{number} / 03</span><ArrowUpRight size={19} /></div>
                <span className="feature-icon"><Icon size={22} strokeWidth={1.7} /></span>
                <h3>{title}</h3><p>{text}</p>
                <span className="feature-more">Қарап көру <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </section>

        <section id="method" className="method-section">
          <div className="method-heading"><p className="eyebrow">ҮШ ҚАРАПАЙЫМ ҚАДАМ</p><h2>Өсімдікке жақынырақ қара.</h2></div>
          <div className="method-steps">
            <article><span>01</span><Sprout size={21} /><h3>Фото түсір</h3><p>Гүлін немесе жапырағын жарық жерде анық түсір.</p></article>
            <ChevronDown className="method-arrow" size={20} />
            <article><span>02</span><Microscope size={21} /><h3>Нәтижені тексер</h3><p>Түрді тану нәтижесін басқа дереккөзбен салыстырып көр.</p></article>
            <ChevronDown className="method-arrow" size={20} />
            <article><span>03</span><ShieldCheck size={21} /><h3>Бақылауды сақта</h3><p>Табылған түрді жеке мұрағатқа қосып, өзгерісін бақыла.</p></article>
          </div>
        </section>

        <section id="about" className="field-note">
          <div className="field-note-mark"><Leaf size={28} /></div>
          <div><p className="eyebrow">QARAGULL · ҚАЗАҚСТАН</p><h2>Табиғатты тану<br />ұқыптылықтан басталады.</h2></div>
          <div className="field-note-copy"><p>Жасанды интеллект ұсынған атау — зерттеудің бастауы ғана. Нәтижені салыстырып, жергілікті түрлерді қорғап, сирек өсімдіктердің орнын жариялама.</p><Link className="text-link" to="/register">Өз далалық дәптеріңді баста <ArrowRight size={16} /></Link></div>
        </section>
      </main>

      <footer className="site-footer">
        <Link className="brand-lockup" to="/"><img className="brand-symbol" src="/mitu-logo.png" alt="" /><span>Qaragull<small>ӨСІМДІК АТЛАСЫ</small></span></Link>
        <p>Далаға мұқият қарау үшін жасалған.</p>
        <span>© {new Date().getFullYear()} Qaragull</span>
      </footer>
    </div>
  )
}
