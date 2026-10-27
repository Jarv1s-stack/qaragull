"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import {
  Leaf,
  Camera,
  History,
  User,
  ArrowRight,
  Sparkles,
  Star,
  UploadCloud,
  Menu,
  X,
  Play,
  Shield,
  Zap,
} from "lucide-react"

// Animated element component
const FadeInElement = ({ children, className, delay = 0 }) => {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    let timeoutId
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timeoutId = window.setTimeout(() => {
            setIsVisible(true)
          }, delay)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (element) observer.observe(element)

    return () => {
      observer.disconnect()
      if (element) observer.unobserve(element)
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [delay])

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  )
}

const HomePage = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const slides = [
    {
      icon: <Leaf className="w-16 h-16 text-green-500" />,
      title: "Өсімдіктерді танып біліңіз",
      description: "Кез келген өсімдіктің суретін түсіріп, оның туралы толық ақпарат алыңыз",
    },
    {
      icon: <Camera className="w-16 h-16 text-blue-500" />,
      title: "Жылдам сканерлеу",
      description: "AI технологиясы арқылы өсімдіктерді дәл анықтаңыз",
    },
    {
      icon: <History className="w-16 h-16 text-purple-500" />,
      title: "Тарихты сақтаңыз",
      description: "Барлық сканерленген өсімдіктердің тарихын қараңыз",
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [slides.length])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Enhanced Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link
              to="/"
              className="flex items-center gap-2 text-2xl font-bold text-gray-800 hover:text-green-600 transition-colors"
            >
              <Leaf className="w-8 h-8 text-green-600" />
              <span>Qaragull</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("features")}
                className="text-gray-600 hover:text-green-600 transition-colors font-medium"
              >
                Мүмкіндіктер
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-gray-600 hover:text-green-600 transition-colors font-medium"
              >
                Қалай жұмыс істейді
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="text-gray-600 hover:text-green-600 transition-colors font-medium"
              >
                Пікірлер
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/login">
                <button className="px-5 py-2 text-sm font-semibold text-gray-700 hover:text-green-700 transition-colors">
                  Кіру
                </button>
              </Link>
              <Link to="/register">
                <button className="px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-all transform hover:scale-105">
                  Тіркелу
                </button>
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-green-600"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-100">
              <nav className="flex flex-col gap-4 pt-4">
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-left text-gray-600 hover:text-green-600 transition-colors font-medium"
                >
                  Мүмкіндіктер
                </button>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="text-left text-gray-600 hover:text-green-600 transition-colors font-medium"
                >
                  Қалай жұмыс істейді
                </button>
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className="text-left text-gray-600 hover:text-green-600 transition-colors font-medium"
                >
                  Пікірлер
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* Enhanced Hero Section with Responsive Background */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 min-h-screen flex items-center overflow-hidden">
          {/* Desktop Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
            style={{
              backgroundImage: `url('https://s15-kling.klingai.com/kimg/EMXN1y8qSQoGdXBsb2FkEg55bGFiLXN0dW50LXNncBova2xpbmcvZG93bmxvYWQvTWpnMU56TXpNVEl4TXpJek1ETTRNek0wTXpnM01qY3o.origin?x-kcdn-pid=112372')`,
            }}
          ></div>

          {/* Mobile Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
            style={{
              backgroundImage: `url('https://s15-kling.klingai.com/kimg/EMXN1y8qTQoGdXBsb2FkEg55bGFiLXN0dW50LXNncBoza2xpbmcvZG93bmxvYWQvTWpnMU56TTFNVE01TlRNd05Ua3dNVEUxTXpJMU9USTRPUT09.origin?x-kcdn-pid=112372')`,
            }}
          ></div>

          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-green-900/40 to-blue-900/50"></div>

          {/* Additional overlay for better contrast */}
          <div className="absolute inset-0 bg-white/15 backdrop-blur-[1px]"></div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              {/* Left side - Content */}
              <FadeInElement className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-green-100/95 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-green-200/50">
                  <Sparkles className="w-4 h-4" />
                  AI арқылы өсімдіктерді анықтау
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl">
                  Өсімдіктер әлемін
                  <span className="text-green-400 block mt- relative">
                    ашыңыз
                    <div className="absolute -bottom-4 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-white/95 mb-10 max-w-lg mx-auto md:mx-0 leading-relaxed drop-shadow-lg">
                  AI технологиясы арқылы кез келген өсімдікті танып біліп, оның туралы толық ақпарат алыңыз
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link to="/register">
                    <button className="group inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 font-bold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transform transition-all duration-300 backdrop-blur-sm border border-green-500/30">
                      Тегін бастау
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="group inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 font-bold text-white bg-white/25 border-2 border-white/40 rounded-xl shadow-2xl backdrop-blur-md hover:bg-white/35 hover:-translate-y-1 transform transition-all duration-300"
                  >
                    <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Қалай жұмыс істейді
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center md:justify-start gap-6 sm:gap-8 mt-12">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">AI</div>
                    <div className="text-xs sm:text-sm text-white/90">Суретпен талдау</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">Қазақша</div>
                    <div className="text-xs sm:text-sm text-white/90">Жауаптар</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">Жеке</div>
                    <div className="text-xs sm:text-sm text-white/90">Сканерлеу тарихы</div>
                  </div>
                </div>
              </FadeInElement>

              {/* Right side - Animated Card (Desktop only) */}
              <FadeInElement delay={300} className="relative h-[28rem] hidden md:block">
                <div className="w-full h-full bg-white/85 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl overflow-hidden">
                  {slides.map((slide, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-700 ease-in-out ${
                        index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-95"
                      }`}
                    >
                      <div className="mb-6 animate-bounce">{slide.icon}</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">{slide.title}</h3>
                      <p className="text-gray-600 leading-relaxed text-center max-w-xs">{slide.description}</p>
                    </div>
                  ))}
                </div>

                {/* Enhanced slide indicators */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex justify-center gap-3">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide ? "bg-green-400 scale-125 shadow-lg" : "bg-white/70 hover:bg-white/90"
                      }`}
                      aria-label={`Слайд ${index + 1} көру`}
                    />
                  ))}
                </div>
              </FadeInElement>

              {/* Mobile Card */}
              <div className="md:hidden mt-8">
                <FadeInElement delay={300} className="relative">
                  <div className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl p-6 text-center">
                    <div className="mb-4">{slides[currentSlide].icon}</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{slides[currentSlide].title}</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">{slides[currentSlide].description}</p>
                  </div>

                  {/* Mobile slide indicators */}
                  <div className="flex justify-center gap-2 mt-4">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentSlide ? "bg-green-400 scale-125" : "bg-white/70"
                        }`}
                        aria-label={`Слайд ${index + 1} көру`}
                      />
                    ))}
                  </div>
                </FadeInElement>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section id="features" className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-6">
            <FadeInElement className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Неге Qaragull таңдау керек?
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Өсімдік сүйгіштер үшін барлық қажетті мүмкіндіктер бір жерде
              </p>
            </FadeInElement>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: <Zap className="w-10 sm:w-12 h-10 sm:h-12 text-yellow-500" />,
                  title: "AI Технологиясы",
                  desc: "Өсімдікті суреті бойынша AI көмегімен анықтау",
                  color: "yellow",
                },
                {
                  icon: <Shield className="w-10 sm:w-12 h-10 sm:h-12 text-green-500" />,
                  title: "Күтім кеңестері",
                  desc: "Жеке кеңестер мен күтім нұсқаулары",
                  color: "green",
                },
                {
                  icon: <User className="w-10 sm:w-12 h-10 sm:h-12 text-purple-500" />,
                  title: "Жеке коллекция",
                  desc: "Өз цифрлық бағыңызды жасаңыз",
                  color: "purple",
                },
              ].map((feature, index) => (
                <FadeInElement
                  key={index}
                  delay={index * 200}
                  className="group text-center p-6 sm:p-8 bg-gray-50 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-4 transform transition-all duration-500 cursor-pointer border border-gray-100"
                >
                  <div className="inline-block p-3 sm:p-4 bg-white rounded-full mb-4 sm:mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{feature.desc}</p>
                </FadeInElement>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced How It Works Section */}
        <section id="how-it-works" className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="container mx-auto px-6">
            <FadeInElement className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">Тек 3 қарапайым қадам</h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">Пайдалану өте оңай және жылдам</p>
            </FadeInElement>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 relative">
              {/* Connection lines - Desktop only */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2">
                <svg width="100%" height="100%" className="overflow-visible">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <line
                    x1="16.66%"
                    y1="50%"
                    x2="83.33%"
                    y2="50%"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeDasharray="10 5"
                  />
                </svg>
              </div>

              {[
                {
                  icon: <Camera className="w-8 sm:w-10 h-8 sm:h-10 text-white" />,
                  title: "1-қадам: Суретке түсіру",
                  desc: "Жапырақ, гүл немесе бүкіл өсімдіктің анық суретін түсіріңіз",
                  bgColor: "bg-green-500",
                },
                {
                  icon: <UploadCloud className="w-8 sm:w-10 h-8 sm:h-10 text-white" />,
                  title: "2-қадам: Жүктеу",
                  desc: "Суретті біздің қосымшаға талдау үшін жүктеңіз",
                  bgColor: "bg-blue-500",
                },
                {
                  icon: <Leaf className="w-8 sm:w-10 h-8 sm:h-10 text-white" />,
                  title: "3-қадам: Нәтиже алу",
                  desc: "Өсімдіктің атауы мен толық ақпаратын лезде біліңіз",
                  bgColor: "bg-purple-500",
                },
              ].map((step, index) => (
                <FadeInElement key={index} delay={index * 300} className="relative text-center group">
                  <div
                    className={`mx-auto w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center ${step.bgColor} rounded-full shadow-xl border-4 border-white mb-4 sm:mb-6 group-hover:scale-110 transition-all duration-300`}
                  >
                    {step.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{step.desc}</p>
                </FadeInElement>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Testimonials Section */}
        <section id="testimonials" className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-6">
            <FadeInElement className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">Пайдаланушылар не дейді</h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Біз бүкіл әлемдегі мыңдаған адамдарға көмектесуімізбен мақтанамыз
              </p>
            </FadeInElement>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  name: "Айгерим К.",
                  quote:
                    "Бұл тамаша қосымша! Енді мен өз бағымдағы барлық гүлдердің атауларын білемін. Қосымша өте қарапайым және ыңғайлы.",
                  avatar: "https://i.pravatar.cc/150?img=1",
                  rating: 5,
                  role: "Бағбан",
                },
                {
                  name: "Арман С.",
                  quote:
                    "Жаңадан бастаған бағбан үшін керемет құрал. Күтім кеңестері менің монстерамды сақтауға көмектесті. Әзірлеушілерге рахмет!",
                  avatar: "https://i.pravatar.cc/150?img=3",
                  rating: 5,
                  role: "Өсімдік сүйгіші",
                },
                {
                  name: "Елена В.",
                  quote:
                    "Qaragull-ті тауларда серуендеу кезінде пайдаланамын. Біздің өлкенің жабайы табиғаты туралы көп жаңа нәрсе үйрендім. Барлығына ұсынамын!",
                  avatar: "https://i.pravatar.cc/150?img=5",
                  rating: 5,
                  role: "Табиғат зерттеушісі",
                },
              ].map((testimonial, index) => (
                <FadeInElement
                  key={index}
                  delay={index * 200}
                  className="bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="flex-grow mb-4 sm:mb-6">
                    <div className="flex text-yellow-400 mb-3 sm:mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5" />
                      ))}
                    </div>
                    <p className="text-gray-700 italic leading-relaxed text-sm sm:text-base">&ldquo;{testimonial.quote}&rdquo;</p>
                  </div>
                  <div className="flex items-center mt-auto">
                    <img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 sm:mr-4 border-2 border-gray-200"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{testimonial.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </FadeInElement>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-r from-green-600 to-blue-600">
          <div className="container mx-auto px-6 text-center">
            <FadeInElement>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                Өсімдіктер әлемін зерттеуге дайынсыз ба?
              </h2>
              <p className="text-lg sm:text-xl text-green-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Тегін тіркеліп, AI арқылы өсімдіктерді анықтауды бастаңыз
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <button className="w-full sm:w-auto px-8 py-4 bg-white text-green-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300">
                    Тегін бастау
                  </button>
                </Link>
                <Link to="/login">
                  <button className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-green-600 transition-all duration-300">
                    Кіру
                  </button>
                </Link>
              </div>
            </FadeInElement>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-6 py-8 sm:py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 sm:w-8 h-6 sm:h-8 text-green-400" />
                <span className="text-xl sm:text-2xl font-bold">Qaragull</span>
              </div>
              <p className="text-gray-400 mb-4 sm:mb-6 max-w-md text-sm sm:text-base">
                AI технологиясы арқылы өсімдіктерді анықтайтын ең жақсы қосымша. Табиғатты зерттеп, білімдеріңізді
                кеңейтіңіз.
              </p>
              <div className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  <span className="text-xs sm:text-sm font-bold">f</span>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  <span className="text-xs sm:text-sm font-bold">t</span>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  <span className="text-xs sm:text-sm font-bold">i</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Навигация</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                  >
                    Мүмкіндіктер
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                  >
                    Қалай жұмыс істейді
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("testimonials")}
                    className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                  >
                    Пікірлер
                  </button>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                  >
                    Тіркелу
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Қолдау</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                    Көмек орталығы
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                    Байланыс
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                    Құпиялылық саясаты
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                    Пайдалану шарттары
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-800 text-center text-gray-500">
            <p className="text-sm sm:text-base">
              &copy; {new Date().getFullYear()} Qaragull. Барлық құқықтар қорғалған.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
