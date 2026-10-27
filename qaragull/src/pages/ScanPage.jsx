"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { labAPI, plantsAPI } from "../services/api"
import Navbar from "../components/Navbar"
import {
  Camera,
  Upload,
  Loader2,
  Sun,
  Droplets,
  TrendingUp,
  MapPin,
  BookOpen,
  X,
  RotateCcw,
  Check,
  Smartphone,
} from "lucide-react"

const ScanPage = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [plantInfo, setPlantInfo] = useState(null)
  const [error, setError] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [facingMode, setFacingMode] = useState("environment") // "user" for front, "environment" for back
  const [isMobile, setIsMobile] = useState(false)
  const [followUpAnswer, setFollowUpAnswer] = useState("")
  const [isRefining, setIsRefining] = useState(false)
  const [reviewMessage, setReviewMessage] = useState("")

  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const navigate = useNavigate()

  // Мобильді құрылғыны анықтау
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 768 ||
          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      )
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => () => {
    if (stream) stream.getTracks().forEach((track) => track.stop())
  }, [stream])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  useEffect(() => () => {
    if (capturedImage) URL.revokeObjectURL(capturedImage)
  }, [capturedImage])

  // Камераны іске қосу
  const startCamera = useCallback(async () => {
    try {
      setError("")

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
        },
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch {
      setError("📱 Камераға қол жеткізу мүмкін емес. Браузер параметрлерінде камера рұқсатын беріңіз.")
    }
  }, [facingMode])

  // Камераны тоқтату
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  // Фото түсіру
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Canvas өлшемін видео өлшеміне сәйкестендіру
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Видеодан кадр алу
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Canvas-тан blob алу
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob)
          setCapturedImage(imageUrl)
          stopCamera()
        }
      },
      "image/jpeg",
      0.9,
    )
  }, [stopCamera])

  // Фотоны растау және автоматты сканерлеу
  const confirmPhoto = useCallback(async () => {
    if (!canvasRef.current) return

    canvasRef.current.toBlob(
      async (blob) => {
        if (blob) {
          const file = new File([blob], `plant-camera-${Date.now()}.jpg`, {
            type: "image/jpeg",
          })

          // Камераны жабу
          setShowCamera(false)
          setCapturedImage(null)

          // Файлды орнату және автоматты сканерлеу
          setSelectedFile(file)
          setPreviewUrl(URL.createObjectURL(file))

          // Автоматты сканерлеу бастау
          await handleAutoScan(file)
        }
      },
      "image/jpeg",
      0.9,
    )
  }, [])

  // Автоматты сканерлеу
  const handleAutoScan = async (file) => {
    setIsScanning(true)
    setError("")

    try {
      const response = await plantsAPI.identifyPlant(file)

      if (response.data && response.data.scan) {
        setPlantInfo(response.data.scan)
      } else {
        throw new Error("Жауап форматы дұрыс емес")
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Өсімдікті анықтау кезінде қате орын алды"
      setError(errorMessage)
    } finally {
      setIsScanning(false)
    }
  }

  // Қайта түсіру
  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    startCamera()
  }, [startCamera])

  // Камераны ауыстыру (алдыңғы/артқы)
  const switchCamera = useCallback(() => {
    stopCamera()
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }, [stopCamera])

  // Камераны жабу
  const closeCamera = () => {
    stopCamera()
    setShowCamera(false)
    setCapturedImage(null)
  }

  // Камераны ашу
  const openCamera = () => {
    setShowCamera(true)
    startCamera()
  }

  // Файл таңдау
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Файл өлшемі 4 MB-тан аспауы керек")
        return
      }

      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        setError("Тек JPEG, PNG, WebP немесе GIF суреттерін жүктеңіз")
        return
      }

      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError("")
      setPlantInfo(null)
    }
  }

  // Қолмен сканерлеу
  const handleScan = async () => {
    if (!selectedFile) return
    await handleAutoScan(selectedFile)
  }

  const handleNewScan = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setPlantInfo(null)
    setError("")
    setFollowUpAnswer("")
    setReviewMessage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFollowUp = async (event) => {
    event.preventDefault()
    if (!followUpAnswer.trim() || !plantInfo?.id) return
    setIsRefining(true)
    setReviewMessage("")
    try {
      const { data } = await plantsAPI.refineDiagnosis(plantInfo.id, followUpAnswer)
      setPlantInfo({ ...plantInfo, diagnosis: data.diagnosis, followUpQuestions: data.followUpQuestions })
      setFollowUpAnswer("")
    } catch (requestError) {
      setReviewMessage(requestError.response?.data?.error || "Қосымша диагноз сұрауы орындалмады")
    } finally { setIsRefining(false) }
  }

  const sendForReview = async () => {
    try {
      await labAPI.requestExpertReview({ scanId: plantInfo.id, question: "AI жауабы белгісіз немесе сенімділігі төмен; ботаникке тексеруге жіберу." })
      setReviewMessage("Тексеруге сұрау жеке кезекке сақталды. Қазір бұл кезек нақты маманға автоматты түрде қосылмаған.")
    } catch (requestError) { setReviewMessage(requestError.response?.data?.error || "Сұрауды сақтау мүмкін болмады") }
  }

  const isProtectedPlant = [plantInfo?.scientificName, plantInfo?.commonName].some((name) => ["tulipa greigii", "tulipa kaufmanniana", "tulipa regelii", "malus sieversii", "грейг қызғалдағы", "кауфман қызғалдағы", "регель қызғалдағы", "сиверс алмасы"].some((protectedName) => String(name || "").toLowerCase().includes(protectedName)))

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const event = { target: { files: [file] } }
      handleFileSelect(event)
    }
  }

  // Камера интерфейсі
  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/80 text-white">
          <button onClick={closeCamera} className="p-2 hover:bg-white/20 rounded-full">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold">📱 Өсімдік фотосын түсіру</h2>
          <button onClick={switchCamera} className="p-2 hover:bg-white/20 rounded-full" disabled={!!capturedImage}>
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative overflow-hidden">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black p-4 z-10">
              <div className="bg-white rounded-lg p-6 text-center max-w-sm">
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={startCamera} className="btn btn-primary">
                  Қайталап көру
                </button>
              </div>
            </div>
          )}

          {capturedImage ? (
            <img
              src={capturedImage || "/placeholder.svg"}
              alt="Captured plant"
              className="w-full h-full object-cover"
            />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          )}

          {/* Фото түсіру нұсқаулығы */}
          {!capturedImage && !error && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Grid */}
              <div className="absolute inset-4 border-2 border-white/30 rounded-lg">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/20"></div>
                  ))}
                </div>
              </div>

              {/* Орталық нұсқаулық */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-black/70 text-white px-4 py-3 rounded-lg text-center">
                  <Camera className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">🌿 Өсімдікті кадрға алыңыз</p>
                  <p className="text-xs opacity-80">Жапырақтар анық көрінуі керек</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-black/80">
          {capturedImage ? (
            <div className="flex justify-center gap-4">
              <button
                onClick={retakePhoto}
                className="px-6 py-3 bg-white/20 border border-white/30 text-white rounded-lg hover:bg-white/30"
              >
                Қайта түсіру
              </button>
              <button
                onClick={confirmPhoto}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Сканерлеу
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={capturePhoto}
                disabled={!!error}
                className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 text-black p-0 shadow-lg flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black"></div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!plantInfo ? (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="card border-0 shadow-lg">
              <div className="p-6 text-center">
                <h1 className="text-2xl font-bold mb-2">Өсімдік суретін жүктеңіз</h1>
                <p className="text-gray-600 mb-6">Өсімдіктің анық суретін таңдаңыз, түсіріңіз немесе жүктеңіз</p>
                <p className="text-xs text-gray-500 max-w-2xl mx-auto mb-6">
                  Сурет OpenRouter арқылы сыртқы AI-провайдерге жіберіледі. Тегін модель сұрауларды журналдап, өнімін жақсартуға қолдануы мүмкін; жеке не құпия суреттерді жүктемеңіз.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {isScanning && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <p className="text-blue-600 font-medium">🤖 AI өсімдікті анықтауда...</p>
                    </div>
                  </div>
                )}

                {previewUrl ? (
                  <div className="space-y-4">
                    <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Selected plant"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-4 justify-center">
                      <button onClick={handleScan} disabled={isScanning} className="btn btn-primary">
                        {isScanning ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Анықталуда...
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            Өсімдікті анықтау
                          </>
                        )}
                      </button>
                      <button onClick={handleNewScan} className="btn btn-secondary">
                        Басқа сурет таңдау
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Камера батырмасы - басты */}
                    <div className="mb-6">
                      <button
                        onClick={openCamera}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-lg text-lg font-semibold shadow-lg flex items-center justify-center gap-3"
                      >
                        <Camera className="w-6 h-6" />📱 {isMobile ? "Телефон" : "Веб"} камерасынан түсіру
                      </button>
                      <p className="text-center text-sm text-gray-500 mt-2">
                        Тікелей камерадан фото түсіріп, автоматты анықтау
                      </p>
                    </div>

                    {/* Файл жүктеу опциялары */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Файл жүктеу */}
                      <div
                        className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Файл жүктеу</h3>
                        <p className="text-gray-600 text-sm">Галереядан немесе компьютерден сурет таңдаңыз</p>
                        <p className="text-xs text-gray-400 mt-2">PNG, JPG, WebP, GIF (макс. 4 MB)</p>
                      </div>

                      {/* Drag & Drop */}
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Drag & Drop</h3>
                        <p className="text-gray-600 text-sm">Суретті осы жерге тартып апарыңыз</p>
                        <p className="text-xs text-gray-400 mt-2">Жылдам және ыңғайлы</p>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tips Section */}
            <div className="card border-0 shadow-lg">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">📸 Жақсы фото түсіру үшін кеңестер</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Camera className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Анық сурет</h4>
                      <p className="text-sm text-gray-600">Өсімдік анық көрінетін сурет түсіріңіз</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sun className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Жақсы жарық</h4>
                      <p className="text-sm text-gray-600">Табиғи жарықта сурет түсіру дұрысырақ</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Камера режимі</h4>
                      <p className="text-sm text-gray-600">Тікелей камерадан түсіру жылдамырақ</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Автоматты анықтау</h4>
                      <p className="text-sm text-gray-600">Фото түсірген соң автоматты сканерленеді</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-6">
            <div className="card border-0 shadow-lg">
              <div className="p-6">
                <h1 className="text-2xl font-bold text-green-600 mb-2">🎉 Өсімдік анықталды!</h1>
                <p className="text-gray-600 mb-6">AI арқылы анықталған ақпарат</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-center rounded-lg overflow-hidden bg-gray-100 min-h-64 max-h-[420px]">
                    <div className="relative inline-block max-w-full">
                    <img
                      src={plantInfo.imageUrl || previewUrl}
                      alt="Scanned plant"
                      className="block max-h-[420px] max-w-full object-contain"
                    />
                    {plantInfo.regions?.length > 0 && <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="AI белгілеген ықтимал зақым аймақтары">
                      {plantInfo.regions.map((region, index) => <g key={`${region.label}-${index}`}><rect x={region.x} y={region.y} width={region.width} height={region.height} fill="rgba(210,90,61,.16)" stroke="#c25336" strokeWidth="5" vectorEffect="non-scaling-stroke" /><text x={region.x + 8} y={Math.max(20, region.y + 24)} fill="#fff" stroke="#633421" strokeWidth="3" paintOrder="stroke" fontSize="24">{index + 1}. {region.label}</text></g>)}
                    </svg>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{plantInfo.commonName}</h3>
                      <p className="text-lg text-gray-600 italic">{plantInfo.scientificName}</p>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{plantInfo.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {plantInfo.accuracy == null ? "Бағаланбаған" : `${plantInfo.accuracy}% AI сенімділігі`}
                      </span>
                      <span className="text-xs text-gray-500">AI-дың субъектив бағасы, сынақпен өлшенген дәлдік емес</span>
                    </div>
                  </div>
                </div>
                {plantInfo.regions?.length > 0 && <div className="mt-4 text-sm text-orange-800 bg-orange-50 rounded-lg p-3">Суреттегі қызыл жиектер — модель болжаған ықтимал белгі аймақтары. Оларды өлшенген зақым шекарасы деп қабылдамаңыз.</div>}
                {isProtectedPlant && <div className="mt-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-4"><strong>Қорғалатын түр болуы мүмкін.</strong> Өсімдікті жұлмаңыз және орналасқан жерін жарияламаңыз. Түрді жергілікті маманнан растаңыз.</div>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-5 border border-gray-100 shadow-md">
                <h2 className="font-semibold text-gray-800 mb-3">Ықтимал үш түр</h2>
                {plantInfo.candidates?.length ? <ol className="space-y-3">{plantInfo.candidates.map((candidate, index) => <li key={`${candidate.scientificName}-${index}`} className="flex gap-3 text-sm"><span className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 text-green-800 font-semibold">{index + 1}</span><span><strong className="block">{candidate.commonName} <em className="font-normal text-gray-500">{candidate.scientificName}</em></strong><span className="text-xs text-gray-600">{candidate.confidence == null ? "Сенімділік көрсетілмеген" : `Модель бағасы ${candidate.confidence}%`} · {candidate.reason || "Түсіндірме берілмеді"}</span></span></li>)}</ol> : <p className="text-sm text-gray-600">Модель балама түрлерді сенімді ажырата алмады. Нақты түрге күштеп теңемей, қосымша анық фото түсіріңіз.</p>}
                {plantInfo.isUnknown && <div className="mt-3 text-xs text-amber-800 bg-amber-50 p-3 rounded-lg">Белгісіз режим: модель дәлел жеткіліксіз екенін белгіледі.</div>}
              </div>
              <div className="card p-5 border border-gray-100 shadow-md">
                <h2 className="font-semibold text-gray-800 mb-3">Денсаулық бойынша болжам</h2>
                <div className={`rounded-lg p-3 text-sm ${plantInfo.diagnosis?.status === "possible_issue" ? "bg-amber-50 text-amber-900" : "bg-green-50 text-green-900"}`}><strong>{plantInfo.diagnosis?.issue || "Белгісіз"}</strong><p className="mt-1">{plantInfo.diagnosis?.reason || "Көрнекі диагноз берілмеді."}</p><small>{plantInfo.diagnosis?.confidence == null ? "Сенімділік бағасы жоқ" : `Субъектив AI бағасы: ${plantInfo.diagnosis.confidence}%`}</small></div>
                {plantInfo.diagnosis?.carePlan?.length > 0 && <ul className="list-disc pl-5 mt-3 text-xs text-gray-700 space-y-1">{plantInfo.diagnosis.carePlan.map((step, index) => <li key={index}>{step}</li>)}</ul>}
                <p className="text-xs text-gray-500 mt-3">Бұл — фотодағы көрініске сүйенген алдын ала болжам. Химиялық препаратты диагноз расталмай қолданбаңыз.</p>
              </div>
            </div>

            {plantInfo.followUpQuestions?.length > 0 && <div className="card p-5 border border-gray-100 shadow-md"><h2 className="font-semibold text-gray-800 mb-2">Себебін ажыратуға көмектесіңіз</h2><p className="text-sm text-gray-600 mb-3">{plantInfo.followUpQuestions[0]}</p><form onSubmit={handleFollowUp} className="flex flex-col sm:flex-row gap-3"><input className="input" value={followUpAnswer} onChange={(event) => setFollowUpAnswer(event.target.value)} maxLength={500} placeholder="Қысқаша жауап" /><button className="btn btn-primary" disabled={isRefining || !followUpAnswer.trim()}>{isRefining ? "Талдауда…" : "Жауапты салыстыру"}</button></form><p className="text-xs text-gray-500 mt-2">Жауап мәтіні OpenRouter AI-ға жіберіледі. Жеке дерек жазбаңыз.</p></div>}

            <div className="card p-5 border border-gray-100 shadow-md"><div className="flex items-center justify-between gap-3 flex-wrap"><div><h2 className="font-semibold text-gray-800">Белгісіз түрді тексеруге жіберу</h2><p className="text-xs text-gray-500 mt-1">Өтініш жеке кезекке сақталады; әзірге қосылған сарапшы жауабы жоқ.</p></div><button className="btn btn-secondary" onClick={sendForReview}>Тексеру кезегіне қосу</button></div>{reviewMessage && <p className="text-sm text-green-800 mt-3" role="status">{reviewMessage}</p>}</div>

            <div className="text-xs text-gray-500">Қарап шығуға арналған дереккөздер: <a className="text-green-700 underline" href="https://www.inaturalist.org/" target="_blank" rel="noreferrer">iNaturalist түр деректері</a>, <a className="text-green-700 underline" href="https://www.rhs.org.uk/" target="_blank" rel="noreferrer">Royal Horticultural Society күтім нұсқаулығы</a>, <a className="text-green-700 underline" href="https://eppo.int/" target="_blank" rel="noreferrer">EPPO өсімдік денсаулығы</a>. Сілтемелер кеңеске дәлел емес, тек маманмен салыстыруға арналған.</div>

            {/* Plant Care Information */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card border-0 shadow-md p-4">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-800">Шығу тегі</h4>
                </div>
                <p className="text-gray-600">{plantInfo.origin}</p>
              </div>

              <div className="card border-0 shadow-md p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Sun className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-gray-800">Жарық</h4>
                </div>
                <p className="text-gray-600">{plantInfo.sunlight}</p>
              </div>

              <div className="card border-0 shadow-md p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-800">Суару</h4>
                </div>
                <p className="text-gray-600">{plantInfo.water}</p>
              </div>

              <div className="card border-0 shadow-md p-4">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-800">Өсу қарқыны</h4>
                </div>
                <p className="text-gray-600">{plantInfo.growthRate}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleNewScan} className="btn btn-primary">
                <Camera className="mr-2 h-4 w-4" />
                Жаңа сканерлеу
              </button>
              <button onClick={() => navigate("/history")} className="btn btn-secondary">
                <BookOpen className="mr-2 h-4 w-4" />
                Тарихты қарау
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ScanPage
