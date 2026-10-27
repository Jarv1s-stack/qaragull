import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import { labAPI, plantsAPI } from "../services/api"

const MapPanel = lazy(() => import("./MapPanel"))
const PlantModel = lazy(() => import("./PlantModel"))
import {
  Activity, AlertTriangle, BookOpen, Camera, Check, ChevronRight, CloudSun, Download,
  FlaskConical, Leaf, Loader2, MapPin, Mic, MicOff, Radio, RefreshCw, Save,
  Sprout, Thermometer, Volume2, Wifi, WifiOff, Wind, Droplets, Sun, Zap,
} from "lucide-react"

const tabs = [
  ["twin", "Өсімдік өмірбаяны", Leaf],
  ["sensors", "Датчиктер", Activity],
  ["weather", "Ауа райы", CloudSun],
  ["map", "Қазақстан атласы", MapPin],
  ["experiments", "Зертхана", FlaskConical],
  ["studio", "AR · 3D · жылыжай", Sprout],
  ["voice", "Дауысты көмекші", Volume2],
  ["offline", "Офлайн анықтамалық", WifiOff],
]

const handbook = [
  { title: "Жарық", body: "Жарық қажеттілігі түрге байланысты. Жапырақ күйіп кетпеуі үшін жарықты біртіндеп өзгертіңіз." },
  { title: "Суару", body: "Күнтізбеге ғана сүйенбей, топырақтың үстіңгі қабатын тексеріңіз. Артық су тамырды зақымдауы мүмкін." },
  { title: "Ауру белгісі", body: "Зақымның фотосын бірнеше күн аралатып түсіріңіз. Белгі таралса немесе өсімдік әлсіресе, маманға көрсетіңіз." },
  { title: "Сирек өсімдік", body: "Жабайы өсімдікті жұлмаңыз. Нақты координатты жарияламаңыз. Суретпен және жуық өңірмен маманға хабарласыңыз." },
]

function Panel({ title, eyebrow, icon: Icon, children, action }) {
  return <section className="lab-panel">
    <div className="lab-panel-heading">
      <div className="lab-panel-title"><span className="lab-icon"><Icon size={18} /></span><div><p className="lab-eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>
      {action}
    </div>
    {children}
  </section>
}

function MiniChart({ rows }) {
  const points = rows.map((row, index) => ({ x: rows.length < 2 ? 50 : 10 + index * 80 / (rows.length - 1), y: 90 - Math.min(80, Math.max(0, Number(row.height_cm || 0) * 3)) }))
  if (!rows.length) return <div className="lab-empty">Өлшем енгізілген соң өсу графигі осында көрінеді.</div>
  const line = points.map((point) => `${point.x},${point.y}`).join(" ")
  return <svg className="lab-chart" viewBox="0 0 100 100" role="img" aria-label="Өсімдіктің биіктігі бойынша өсу графигі" preserveAspectRatio="none">
    {[20, 40, 60, 80].map((y) => <line key={y} x1="5" x2="95" y1={y} y2={y} className="lab-chart-grid" />)}
    <polyline points={line} className="lab-chart-line" />
    {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="2.2" className="lab-chart-point"><title>{rows[index].height_cm} cm</title></circle>)}
  </svg>
}

function CameraAR() {
  const video = useRef(null); const [stream, setStream] = useState(null); const [active, setActive] = useState(false); const [error, setError] = useState(""); const [label, setLabel] = useState("Жапырақ жүйкесі")
  useEffect(() => {
    const videoElement = video.current
    if (!videoElement || !stream) return
    videoElement.srcObject = stream
    videoElement.play().catch(() => setError("Камера бейнесін бастау мүмкін болмады. Қайта ашып көріңіз."))
    return () => { videoElement.srcObject = null }
  }, [stream, active])
  useEffect(() => () => { stream?.getTracks().forEach((track) => track.stop()) }, [stream])
  const stop = useCallback(() => { stream?.getTracks().forEach((track) => track.stop()); setStream(null); setActive(false) }, [stream])
  const start = async () => { try { setError(""); const cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); setStream(cameraStream); setActive(true) } catch { setError("Камера ашылмады. Рұқсатты тек батырманы басқан кезде сұраймыз.") } }
  return <div className="lab-camera-box">
    {active ? <div className="lab-camera-view"><video ref={video} autoPlay muted playsInline /><div className="lab-ar-crosshair"><span /><b>{label}</b><small>AR оқу қабаты · өлшем емес</small></div></div> : <div className="lab-camera-placeholder"><Camera size={26} /><span>Камера өздігінен қосылмайды</span></div>}
    {error && <p className="lab-feedback">{error}</p>}
    <div className="lab-actions"><button className="lab-button primary" onClick={active ? stop : start}>{active ? "Камераны тоқтату" : "Камераны ашу"}</button><select aria-label="AR белгісі" value={label} onChange={(event) => setLabel(event.target.value)}><option>Жапырақ жүйкесі</option><option>Зақымданған аймақ</option><option>Жапырақ ұшы</option><option>Суару нүктесі</option></select></div>
  </div>
}

function TwinPanel({ profiles, setProfiles, scans }) {
  const [form, setForm] = useState({ name: "", scanId: "" }); const [selected, setSelected] = useState(""); const [events, setEvents] = useState([]); const [notes, setNotes] = useState(""); const [eventType, setEventType] = useState("Суару"); const [message, setMessage] = useState("")
  useEffect(() => { if (profiles.length && !selected) setSelected(String(profiles[0].id)) }, [profiles, selected])
  useEffect(() => { if (selected) labAPI.getCareEvents(selected).then(({ data }) => setEvents(data.events || [])).catch(() => setEvents([])) }, [selected])
  const selectedProfile = profiles.find((profile) => String(profile.id) === String(selected))
  const relatedScans = scans
    .filter((scan) => selectedProfile && scan.scientificName?.toLowerCase() === selectedProfile.scientific_name?.toLowerCase())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const recentIssueCount = relatedScans.filter((scan) => scan.diagnosis?.status === "possible_issue" && Date.now() - new Date(scan.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000).length
  const watchSignal = recentIssueCount > 1 ? "қайталанған AI белгісі" : recentIssueCount === 1 ? "бір күмәнді AI белгісі" : relatedScans.length ? "қайталанған белгі тіркелмеді" : "дерек жеткіліксіз"
  const create = async (event) => { event.preventDefault(); setMessage(""); try { const scan = scans.find((item) => String(item.id) === String(form.scanId)); const { data } = await labAPI.createProfile({ name: form.name, scanId: scan?.id, commonName: scan?.commonName || form.name, scientificName: scan?.scientificName || "" }); setProfiles([data.profile, ...profiles]); setSelected(String(data.profile.id)); setForm({ name: "", scanId: "" }); setMessage("Жеке өсімдік профилі сақталды.") } catch (error) { setMessage(error.response?.data?.error || "Профильді сақтау мүмкін болмады. Схеманы жаңартып көріңіз.") } }
  const logCare = async (event) => { event.preventDefault(); if (!selected) return; try { const { data } = await labAPI.createCareEvent({ profileId: selected, eventType, notes }); setEvents([data.event, ...events]); setNotes(""); setMessage("Күтім тарихы жаңартылды.") } catch (error) { setMessage(error.response?.data?.error || "Күтім жазбасын сақтау мүмкін болмады") } }
  const saveReview = async () => { try { await labAPI.requestExpertReview({ question: `Қолжетімділігі төмен AI нәтижесін тексеру: ${selectedProfile?.common_name || "өсімдік"}` }); setMessage("Тексеруге өтініш жергілікті кезекке қосылды. Бұл кезек нақты маманға автоматты түрде жіберілмейді.") } catch (error) { setMessage(error.response?.data?.error || "Өтініш сақталмады") } }
  return <div className="lab-stack">
    <Panel title="Әр өсімдікке жеке өмірбаян" eyebrow="DIGITAL TWIN · PERSONAL" icon={Leaf}>
      <p className="lab-copy">Сканды түрі бойынша сәйкестендіру тек ұсыныс береді. Соңғы таңдауды өзіңіз жасайсыз; бірдей атау өсімдік бірдей екенін дәлелдемейді.</p>
      {profiles.length > 0 && <div className="lab-profile-row"><select aria-label="Өсімдік профилін таңдау" value={selected} onChange={(event) => setSelected(event.target.value)}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {profile.common_name}</option>)}</select><span className="lab-tag">{relatedScans.length} ұқсас скан</span></div>}
      {selectedProfile && <><div className="lab-identity-card"><div className="lab-identity-mark"><Sprout size={28} /></div><div><strong>{selectedProfile.name}</strong><span>{selectedProfile.common_name}</span><em>{selectedProfile.scientific_name || "Ғылыми атауы белгісіз"}</em></div><div className="lab-risk"><small>Соңғы 30 күн</small><strong>{watchSignal}</strong><span>Қарапайым бақылау эвристикасы</span></div></div><p className="lab-muted">Бұл — соңғы скандардағы AI белгісінің жиілігі ғана; аурудың не нашарлаудың ғылыми болжамы емес.</p></>}
      <form className="lab-form-grid" onSubmit={create}>
        <label>Жеке атауы<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Мысалы: терезе алдындағы фикус" required maxLength={120} /></label>
        <label>Сканнан сәйкестендіру<select value={form.scanId} onChange={(event) => setForm({ ...form, scanId: event.target.value })}><option value="">Сканды кейін қосамын</option>{scans.map((scan) => <option key={scan.id} value={scan.id}>{scan.commonName} · {new Date(scan.createdAt).toLocaleDateString("kk-KZ")}</option>)}</select></label>
        <button className="lab-button primary"><Save size={16} />Өмірбаян ашу</button>
      </form>
    </Panel>
    {selectedProfile && <div className="lab-two-col">
      <Panel title="Күтім хронологиясы" eyebrow="WATER · LIGHT · NOTES" icon={BookOpen}>
        <form className="lab-inline-form" onSubmit={logCare}><select value={eventType} onChange={(event) => setEventType(event.target.value)}><option>Суару</option><option>Тыңайтқыш</option><option>Жарықты ауыстыру</option><option>Жапырақты тексеру</option><option>Басқа</option></select><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ескерту (міндетті емес)" maxLength={1000} /><button className="lab-button primary">Жазу</button></form>
        <div className="lab-timeline">{events.length ? events.map((item) => <div className="lab-timeline-item" key={item.id}><i /><div><strong>{item.event_type}</strong><span>{new Date(item.created_at).toLocaleString("kk-KZ")}</span>{item.notes && <p>{item.notes}</p>}</div></div>) : <div className="lab-empty">Өсімдіктің күтімі тіркелмеген.</div>}</div>
      </Panel>
      <Panel title="Сурет бойынша уақыт сызығы" eyebrow="MANUAL ID MATCH" icon={RefreshCw}>
        <p className="lab-muted">Түр атауы сәйкес скандар төменде көрсетілді. Бір өсімдік екенін өзіңіз растаңыз.</p>
        <div className="lab-scan-strip">{relatedScans.length ? relatedScans.slice(0, 6).map((scan) => <figure key={scan.id}><div className="lab-scan-preview"><img src={scan.imageUrl} alt={`${scan.commonName}, ${new Date(scan.createdAt).toLocaleDateString("kk-KZ")}`} />{(scan.regions || []).map((region, index) => <span key={`${scan.id}-${index}`} className="lab-scan-region" title={region.label} style={{ left: `${region.x / 10}%`, top: `${region.y / 10}%`, width: `${region.width / 10}%`, height: `${region.height / 10}%` }} />)}</div><figcaption>{new Date(scan.createdAt).toLocaleDateString("kk-KZ")}<span>{scan.diagnosis?.issue || (scan.isUnknown ? "Түр белгісіз" : "Белгі тіркелмеген")}</span></figcaption></figure>) : <div className="lab-empty">Бұл түрге сәйкес скан табылмады.</div>}</div>
        <button className="lab-button secondary" onClick={saveReview}>Белгісіз нәтиже болса маман кезегіне жіберу</button>
      </Panel>
    </div>}
    {message && <p className="lab-feedback" role="status">{message}</p>}
  </div>
}

function SensorPanel({ profiles, readings, setReadings, connectSerial, disconnectSerial, serialConnected, serialError }) {
  const [selectedProfile, setSelectedProfile] = useState("")
  const [sample, setSample] = useState({ soilMoisture: 34, lightLux: 1200, temperatureC: 23.5, leafSignal: 0.18 })
  const [feedback, setFeedback] = useState("")
  const save = async (source = "demo", values = sample) => {
    try { const { data } = await labAPI.createReading({ ...values, profileId: selectedProfile || null, source }); setReadings([data.reading, ...readings].slice(0, 30)); setFeedback(source === "demo" ? "Симуляция ретінде белгіленіп сақталды." : "Сенсор өлшемі сақталды.") }
    catch (error) { setFeedback(error.response?.data?.error || "Дерекқорға сақтау мүмкін болмады") }
  }
  const simulate = () => { const values = { soilMoisture: Math.round(20 + Math.random() * 60), lightLux: Math.round(300 + Math.random() * 3800), temperatureC: Number((19 + Math.random() * 13).toFixed(1)), leafSignal: Number((Math.random() * 1.8 - 0.9).toFixed(3)) }; setSample(values); save("demo", values) }
  const latest = readings[0] ? { soilMoisture: readings[0].soil_moisture, lightLux: readings[0].light_lux, temperatureC: readings[0].temperature_c, leafSignal: readings[0].leaf_signal, source: readings[0].source } : sample
  return <div className="lab-stack">
    <div className="lab-note warning"><Radio size={16} />«Симуляция» өлшемдері — жалған demo дерегі. Нақты датчикке арналған Web Serial CSV форматы: <code>ылғал%, жарық lux, температура °C, электр сигналы</code>.</div>
    <Panel title="ESP32 сенсор журналы" eyebrow="SOIL · LUX · TEMPERATURE" icon={Activity} action={<span className={`lab-connection ${serialConnected ? "connected" : ""}`}><i />{serialConnected ? "құрылғы қосулы" : "құрылғы қосылмаған"}</span>}>
      <div className="lab-sensor-grid">{[["Топырақ ылғалы", latest.soilMoisture, "%", Droplets], ["Жарық", latest.lightLux, "lux", Sun], ["Температура", latest.temperatureC, "°C", Thermometer], ["Жапырақ сигналы", latest.leafSignal, "mV · прототип", Activity]].map(([name, value, unit, Icon]) => <div className="lab-sensor-tile" key={name}><span><Icon size={17} />{name}</span><strong>{value ?? "—"}<small>{unit}</small></strong><div className="lab-meter"><i style={{ width: `${Math.min(100, Math.max(4, Number(value || 0) / (unit === "%" ? 1 : unit === "lux" ? 60 : unit === "°C" ? 1 : 25)))}%` }} /></div></div>)}</div>
      {latest.source && <span className="lab-tag">Соңғы дерек: {latest.source === "serial" ? "нақты Serial" : "симуляция"}</span>}
      <div className="lab-actions"><select value={selectedProfile} onChange={(event) => setSelectedProfile(event.target.value)}><option value="">Өсімдік профилі таңдалмаған</option>{profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}</select><button className="lab-button secondary" onClick={simulate}><Zap size={15} />Демо өлшем</button><button className="lab-button primary" onClick={serialConnected ? disconnectSerial : connectSerial}><Radio size={15} />{serialConnected ? "ESP32-ні ажырату" : "ESP32 / Web Serial"}</button></div>
      {serialError && <p className="lab-feedback">{serialError}</p>}{feedback && <p className="lab-feedback" role="status">{feedback}</p>}
      {readings.length > 0 && <div className="lab-reading-list">{readings.slice(0, 6).map((item) => <div key={item.id}><span>{new Date(item.created_at).toLocaleString("kk-KZ")}</span><strong>{item.soil_moisture ?? "—"}%</strong><span>{item.temperature_c ?? "—"}°C</span><em>{item.source === "serial" ? "ESP32" : "DEMO"}</em></div>)}</div>}
    </Panel>
    <div className="lab-two-col">
      <Panel title="Электр сигналдары · зерттеу үлгісі" eyebrow="ДИАГНОЗ ҚОЙМАЙДЫ" icon={Activity}>
        {(() => {
          const serialSignals = readings.filter((reading) => reading.source === "serial" && Number.isFinite(Number(reading.leaf_signal))).slice(0, 30).reverse()
          const demoSignals = readings.filter((reading) => Number.isFinite(Number(reading.leaf_signal))).slice(0, 30).reverse()
          const chartRows = serialSignals.length ? serialSignals : demoSignals
          const values = chartRows.map((reading) => Number(reading.leaf_signal))
          const min = values.length ? Math.min(...values) : -1
          const max = values.length ? Math.max(...values) : 1
          const points = values.map((value, index) => `${values.length < 2 ? 200 : index * 400 / (values.length - 1)},${max === min ? 36 : 64 - (value - min) / (max - min) * 56}`)
          return <><div className="lab-sparkline"><svg viewBox="0 0 400 72" preserveAspectRatio="none" aria-label="Өсімдіктің әлсіз электр сигналының графигі"><path d={points.length > 1 ? `M${points.join(" L")}` : "M0 36 L20 36 L30 34 L37 40 L45 22 L52 54 L59 36 L83 36 L92 32 L101 38 L110 36 L134 35 L142 41 L151 18 L158 57 L165 36 L195 36 L203 33 L211 39 L219 35 L245 36 L254 42 L261 21 L268 52 L276 36 L305 36 L314 34 L324 39 L332 35 L355 36 L363 40 L371 25 L380 50 L390 36 L400 36"} /></svg></div><span className="lab-tag">{serialSignals.length ? `${serialSignals.length} нақты Serial өлшемі` : chartRows.length ? "Демо өлшемдері · синтетикалық" : "Синтетикалық үлгі"}</span></>
        })()}
        <p className="lab-muted">Демо толқыны — синтетикалық үлгі. Нақты Serial өлшемі электродтан алынған әлсіз потенциалды ғана көрсетеді; бұл өсімдік «сөйлейді» немесе диагноз дегенді білдірмейді.</p>
      </Panel>
      <Panel title="Өсімдік күйін тексеру" eyebrow="ҚАРАПАЙЫМ ШЕКТЕР" icon={AlertTriangle}>
        <p className="lab-copy">Жуық эвристика: температура 35°C-тан жоғары немесе топырақ ылғалы 15%-дан төмен болса, тексеру ескертуі шығады.</p>
        {Number(latest.temperatureC) > 35 || Number(latest.soilMoisture) < 15 ? <div className="lab-note warning">Көрсеткіш шектен тыс. Датчиктің калибровкасын және нақты топырақты тексеріңіз.</div> : <div className="lab-note success"><Check size={16} />Қарапайым шектерден асқан жоқ. Бұл сау екенін дәлелдемейді.</div>}
      </Panel>
    </div>
  </div>
}

const defaultWeatherLocation = { latitude: 51.1694, longitude: 71.4491, name: "Астана · демо нүкте" }
function WeatherPanel() {
  const [coords, setCoords] = useState(defaultWeatherLocation)
  const [weather, setWeather] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false)
  const load = useCallback(async (point = defaultWeatherLocation) => { setLoading(true); setError(""); try { const url = new URL("https://api.open-meteo.com/v1/forecast"); url.search = new URLSearchParams({ latitude: point.latitude, longitude: point.longitude, current: "temperature_2m,relative_humidity_2m,precipitation,weather_code", daily: "temperature_2m_min,temperature_2m_max,precipitation_probability_max", forecast_days: "7", timezone: "auto" }).toString(); const response = await fetch(url); if (!response.ok) throw new Error("Ауа райы дерегі жүктелмеді"); setWeather(await response.json()); setCoords(point) } catch (loadError) { setError(loadError.message) } finally { setLoading(false) } }, [])
  useEffect(() => { load(defaultWeatherLocation) }, [load])
  const useLocation = () => { if (!navigator.geolocation) { setError("Бұл браузер геолокацияны қолдамайды"); return } navigator.geolocation.getCurrentPosition((position) => load({ latitude: position.coords.latitude, longitude: position.coords.longitude, name: "Сіздің жуық орналасуыңыз" }), () => setError("Орналасу рұқсаты берілмеді; Астана демо нүктесі қолданылады."), { timeout: 10000, maximumAge: 300000 }) }
  const days = weather?.daily?.time || []
  const codeAdvice = (code, min, max, rain) => { if (min <= 0) return "Үсік қаупі: сезімтал өсімдікті қорғаңыз."; if (max >= 35) return "Ыстық күн: топырақты тексеріп, тікелей күннен сақтаңыз."; if (rain >= 60) return "Жауын ықтимал: суаруды топырақты тексерген соң шешіңіз."; if (code >= 51) return "Жаңбырлы кезең: жапырақтың ұзақ сулануын бақылаңыз."; return "Суару кестесін ауа райымен бірге топыраққа қарап реттеңіз." }
  return <div className="lab-stack">
    <Panel title="Ауа райына бейім күтім" eyebrow="OPEN-METEO · 7 КҮН" icon={CloudSun} action={<button className="lab-icon-button" onClick={() => load()} aria-label="Ауа райын жаңарту"><RefreshCw size={16} /></button>}>
      <div className="lab-weather-now"><div><span>{coords.name}</span><strong>{weather?.current?.temperature_2m ?? "—"}°</strong><small>салыстырмалы ылғал {weather?.current?.relative_humidity_2m ?? "—"}%</small></div><div><Thermometer size={28} /><Wind size={26} /><Droplets size={26} /></div></div>
      {loading && <p className="lab-status"><Loader2 size={15} className="animate-spin" /> Ауа райы жаңартылуда…</p>}{error && <p className="lab-feedback">{error}</p>}
      <div className="lab-forecast">{days.map((day, index) => <div className="lab-day" key={day}><span>{new Date(`${day}T12:00:00`).toLocaleDateString("kk-KZ", { weekday: "short" })}</span><strong>{weather.daily.temperature_2m_max[index]}°</strong><small>{weather.daily.temperature_2m_min[index]}° / жауын {weather.daily.precipitation_probability_max[index]}%</small><p>{codeAdvice(weather.current?.weather_code, weather.daily.temperature_2m_min[index], weather.daily.temperature_2m_max[index], weather.daily.precipitation_probability_max[index])}</p></div>)}</div>
      <div className="lab-actions"><button className="lab-button secondary" onClick={useLocation}><MapPin size={15} />Менің орналасуымды қолдану</button><span className="lab-muted">Рұқсат батырманы басқанда ғана сұралады.</span></div>
      <p className="lab-source">Ауа райы: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>, CC BY 4.0. Күтім кеңесі — эвристика; нақты топырақ ылғалын алмастырмайды.</p>
    </Panel>
    <div className="lab-note success"><CloudSun size={17} />Үсік пен ыстық ескертулері тәуліктік болжамның минимум/максимумына негізделеді. Суару автоматты жүргізілмейді.</div>
  </div>
}

function ExperimentsPanel({ experiments, setExperiments }) {
  const [form, setForm] = useState({ title: "", hypothesis: "" }); const [measurement, setMeasurement] = useState({ experimentId: "", groupName: "Бақылау", heightCm: "", leafCount: "", soilMoisture: "", notes: "" }); const [status, setStatus] = useState("")
  const selected = experiments.find((item) => String(item.id) === String(measurement.experimentId)) || experiments[0]
  const createExperiment = async (event) => { event.preventDefault(); try { const { data } = await labAPI.createExperiment(form); setExperiments([{ ...data.experiment, measurements: [] }, ...experiments]); setMeasurement({ ...measurement, experimentId: String(data.experiment.id) }); setForm({ title: "", hypothesis: "" }); setStatus("Зерттеу хаттамасы сақталды.") } catch (error) { setStatus(error.response?.data?.error || "Зерттеуді сақтау мүмкін болмады") } }
  const addMeasurement = async (event) => { event.preventDefault(); if (!selected) return; try { const { data } = await labAPI.createMeasurement({ ...measurement, experimentId: selected.id }); setExperiments(experiments.map((item) => item.id === selected.id ? { ...item, measurements: [...(item.measurements || []), data.measurement] } : item)); setStatus("Өлшем уақыт белгісімен сақталды."); setMeasurement({ ...measurement, heightCm: "", leafCount: "", soilMoisture: "", notes: "" }) } catch (error) { setStatus(error.response?.data?.error || "Өлшемді сақтау мүмкін болмады") } }
  const exportReport = () => { if (!selected) return; const lines = [`Qaragull зертханалық есебі`, `Тәжірибе: ${selected.title}`, `Болжам: ${selected.hypothesis || "—"}`, `Өлшем саны: ${selected.measurements?.length || 0}`, "", ...(selected.measurements || []).map((item) => `${new Date(item.created_at).toLocaleString("kk-KZ")} | ${item.group_name} | бойы ${item.height_cm ?? "—"} см | жапырақ ${item.leaf_count ?? "—"} | ылғал ${item.soil_moisture ?? "—"}% | ${item.notes || ""}`)]; const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "qaragull-lab-report.txt"; anchor.click(); URL.revokeObjectURL(url) }
  return <div className="lab-stack">
    <Panel title="Бақылау және тәжірибе" eyebrow="SCIENTIFIC NOTEBOOK" icon={FlaskConical}>
      <p className="lab-copy">Әртүрлі суару/жарық топтарын бақылау және өлшем енгізу. Қорытынды тек осы шағын бақылау деректерін сипаттайды — ғылыми дәлел деп саналмайды.</p>
      <form className="lab-form-grid" onSubmit={createExperiment}><label>Тәжірибе атауы<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required maxLength={160} placeholder="Мысалы: таңғы жарықтың өсуге әсері" /></label><label>Болжам<textarea value={form.hypothesis} onChange={(event) => setForm({ ...form, hypothesis: event.target.value })} maxLength={1000} placeholder="Қай факторды өзгертесіз?" /></label><button className="lab-button primary"><FlaskConical size={15} />Зерттеу бастау</button></form>
    </Panel>
    {experiments.length > 0 && <div className="lab-two-col"><Panel title="Өлшем енгізу" eyebrow="CONTROL · TREATMENT" icon={Activity}><form className="lab-form-grid" onSubmit={addMeasurement}><label>Зерттеу<select value={measurement.experimentId || String(experiments[0].id)} onChange={(event) => setMeasurement({ ...measurement, experimentId: event.target.value })}>{experiments.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Топ атауы<input value={measurement.groupName} onChange={(event) => setMeasurement({ ...measurement, groupName: event.target.value })} /></label><label>Бойы · см<input type="number" min="0" step="0.1" value={measurement.heightCm} onChange={(event) => setMeasurement({ ...measurement, heightCm: event.target.value })} /></label><label>Жапырақ саны<input type="number" min="0" step="1" value={measurement.leafCount} onChange={(event) => setMeasurement({ ...measurement, leafCount: event.target.value })} /></label><label>Топырақ ылғалы · %<input type="number" min="0" max="100" value={measurement.soilMoisture} onChange={(event) => setMeasurement({ ...measurement, soilMoisture: event.target.value })} /></label><label>Жазба<input value={measurement.notes} onChange={(event) => setMeasurement({ ...measurement, notes: event.target.value })} maxLength={1000} /></label><button className="lab-button primary"><Save size={15} />Өлшем сақтау</button></form></Panel><Panel title={selected?.title || "Өсу графигі"} eyebrow={`${selected?.measurements?.length || 0} ӨЛШЕМ`} icon={Activity} action={<button className="lab-icon-button" aria-label="Есепті жүктеу" onClick={exportReport} disabled={!selected}><Download size={16} /></button>}><MiniChart rows={(selected?.measurements || []).filter((row) => row.group_name === measurement.groupName)} /><div className="lab-legend"><span><i />{measurement.groupName || "Бақылау"}</span><span>см</span></div></Panel></div>}
    {!experiments.length && <div className="lab-empty">Алдымен бірінші тәжірибені бастаңыз.</div>}{status && <p className="lab-feedback" role="status">{status}</p>}
  </div>
}

function StudioPanel({ readings, serialConnected, sendActuator }) {
  const [growth, setGrowth] = useState(10); const [leaves, setLeaves] = useState(8); const [actuators, setActuators] = useState({ lamp: false, fan: false, pump: false }); const [ greenhouseMessage, setGreenhouseMessage ] = useState("")
  useEffect(() => {
    if (!serialConnected) return undefined
    const heartbeat = window.setInterval(() => sendActuator(actuators), 10000)
    return () => window.clearInterval(heartbeat)
  }, [actuators, serialConnected, sendActuator])
  const apply = (next) => { setActuators(next); if (next.pump) setTimeout(() => { const safe = { ...next, pump: false }; setActuators(safe); if (serialConnected) sendActuator(safe) }, 4000); if (serialConnected) sendActuator(next); setGreenhouseMessage(serialConnected ? "Команда қосылған құрылғыға жіберілді." : "Қауіпсіз demo режимі: нақты сорғы/шам қосылған жоқ.") }
  return <div className="lab-stack">
    <div className="lab-two-col"><Panel title="Камерадағы оқу қабаты" eyebrow="AR HELPER · CAMERA OPTIONAL" icon={Camera}><p className="lab-copy">Браузердің камерасына графикалық белгі қабаттайды. Бұл AR детектор емес, жапырақты қолмен көрсетуге арналған оқу режимі.</p><CameraAR /></Panel><Panel title="Өсу уақытының 3D моделі" eyebrow="PROCEDURAL · NOT PHOTOGRAMMETRY" icon={Sprout}><p className="lab-copy">Суреттен фотограмметрия жасалмайды: модель биіктік пен жапырақ санына қарай сызылатын шартты 3D өсімдік.</p><Suspense fallback={<div className="lab-3d-canvas lab-empty">3D модель жүктелуде…</div>}><PlantModel growth={growth} leaves={leaves} /></Suspense><label className="lab-range">Өсу кезеңі<input type="range" min="1" max="30" value={growth} onChange={(event) => setGrowth(Number(event.target.value))} /><span>{growth} шартты күн</span></label><label className="lab-range">Жапырақ саны<input type="range" min="2" max="18" value={leaves} onChange={(event) => setLeaves(Number(event.target.value))} /><span>{leaves}</span></label></Panel></div>
    <div className="lab-two-col"><Panel title="Мини-жылыжай · қауіпсіз симулятор" eyebrow="NO ACTUATOR WITHOUT SERIAL" icon={Zap}><p className="lab-copy">Ақау не шектен тыс жағдай табылса, симуляция сорғыны 4 секундта тоқтатады. Нақты құрылғы тек Web Serial арқылы, батырма басқанда ғана басқарылуы мүмкін.</p><div className="lab-controller-state"><span><Thermometer size={16} />Датчик температурасы</span><strong>{readings[0]?.temperature_c ?? "—"}°C</strong><span className="lab-tag">{serialConnected ? "Serial қосулы" : "Тек демо"}</span></div><div className="lab-actuators">{[["lamp", "Өсу шамы", Sun], ["fan", "Желдеткіш", Wind], ["pump", "Су сорғысы", Droplets]].map(([key, title, Icon]) => <button key={key} className={`lab-actuator ${actuators[key] ? "on" : ""}`} onClick={() => apply({ ...actuators, [key]: !actuators[key] })}><Icon size={19} /><span>{title}</span><i>{actuators[key] ? "қосулы" : "сөндірулі"}</i></button>)}</div>{greenhouseMessage && <p className="lab-feedback" role="status">{greenhouseMessage}</p>}</Panel><p className="lab-note warning"><AlertTriangle size={16} />Термокамера арқылы ерте стресс анықтау енгізілмеді: арнайы жылу датчигі қажет, кәдімгі телефон камерасы жылуды өлшемейді.</p></div>
  </div>
}

function VoicePanel() {
  const [language, setLanguage] = useState("kk-KZ"); const [question, setQuestion] = useState(""); const [answer, setAnswer] = useState("Өсімдік туралы сұрақты жазыңыз немесе дауыспен айтыңыз. Кеңес жалпы сипатта беріледі."); const [listening, setListening] = useState(false); const recognitionRef = useRef(null)
  const speak = () => { if (!window.speechSynthesis) { setAnswer("Бұл браузер дауыстап оқуды қолдамайды."); return } window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(answer); utterance.lang = language; window.speechSynthesis.speak(utterance) }
  const process = (text) => { setQuestion(text); const words = text.toLowerCase(); const next = words.includes("су") || words.includes("вод") ? "Топырақтың үстіңгі қабатын саусағыңызбен тексеріңіз. Ылғал болса, суаруды кейінге қалдырыңыз." : words.includes("сир") || words.includes("қорғ") ? "Сирек жабайы өсімдікті жұлмаңыз және нақты координатын бөліспеңіз. Фотоны жергілікті маманға көрсетіңіз." : "Суретті бірнеше күн аралатып, бірдей жарықта салыстырыңыз. AI белгісі нақты диагноз емес; өзгеріс таралса маманға көрсетіңіз."; setAnswer(next) }
  const listen = () => { const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) { setAnswer("Дауысты тану бұл браузерде жоқ. Сұрағыңызды мәтінмен жазыңыз."); return } try { const recognition = new SpeechRecognition(); recognition.lang = language; recognition.interimResults = false; recognition.onresult = (event) => process(event.results[0][0].transcript); recognition.onerror = () => setAnswer("Микрофон рұқсаты болмады. Сұрағыңызды мәтінмен енгізе аласыз."); recognition.onend = () => setListening(false); recognitionRef.current = recognition; recognition.start(); setListening(true) } catch { setAnswer("Микрофон ашылмады; мәтіндік енгізуді қолданыңыз."); setListening(false) } }
  return <Panel title="Қазақша және орысша көмекші" eyebrow="BROWSER SPEECH · FREE" icon={Volume2}><p className="lab-copy">Дауыс тану қолдайтын браузерде микрофон тек батырманы басқанда сұралады. Сөйлеу тану браузерге байланысты сыртқы қызмет қолдануы мүмкін.</p><div className="lab-inline-form"><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="kk-KZ">Қазақша</option><option value="ru-RU">Русский</option></select><button className="lab-button secondary" onClick={listen}>{listening ? <MicOff size={15} /> : <Mic size={15} />}{listening ? "Тыңдап тұр…" : "Сұрақты дауыспен айту"}</button></div><textarea className="lab-voice-input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Мысалы: топырақты қашан суарамын?" /><div className="lab-actions"><button className="lab-button primary" onClick={() => process(question)}>Көмек алу</button><button className="lab-button secondary" onClick={speak}><Volume2 size={15} />Жауапты оқу</button></div><div className="lab-voice-answer">{answer}</div></Panel>
}

function OfflinePanel() {
  const [online, setOnline] = useState(navigator.onLine); const [saved, setSaved] = useState(Boolean(localStorage.getItem("qaragull-offline-handbook")))
  useEffect(() => { const on = () => setOnline(true); const off = () => setOnline(false); window.addEventListener("online", on); window.addEventListener("offline", off); return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off) } }, [])
  const save = () => { localStorage.setItem("qaragull-offline-handbook", JSON.stringify(handbook)); setSaved(true) }
  const cached = saved ? JSON.parse(localStorage.getItem("qaragull-offline-handbook") || "[]") : handbook
  return <div className="lab-stack"><Panel title="Желі жоқта қолжетімді анықтамалық" eyebrow="PWA · LOCAL CACHE" icon={WifiOff} action={<span className={`lab-connection ${online ? "connected" : ""}`}><i />{online ? "желі бар" : "офлайн"}</span>}><p className="lab-copy">Қолданба қабығы мен осы қысқа нұсқаулық бірінші ашылғаннан кейін кэштеледі. AI скан, карта, синхрондау және ауа райы офлайн істемейді.</p><button className="lab-button primary" onClick={save}><Save size={15} />Нұсқаулықты осы құрылғыға сақтау</button><div className="lab-handbook">{cached.map((item) => <article key={item.title}><BookOpen size={18} /><div><strong>{item.title}</strong><p>{item.body}</p></div></article>)}</div><p className="lab-source">Бұл оқу мазмұны осы браузердегі localStorage ішінде сақталады. Қоғамдық компьютерде деректерді сақтамаңыз.</p></Panel><div className="lab-note success"><Wifi size={17} />Офлайн режим интернетсіз жұмыс істейтін AI деп мәлімдемейді. Камера, модель және дерекқорға сұраныс қайта байланыс орнағанда ғана жүреді.</div></div>
}

function LabPage() {
  const [active, setActive] = useState("twin")
  const [profiles, setProfiles] = useState([]); const [scans, setScans] = useState([]); const [readings, setReadings] = useState([]); const [experiments, setExperiments] = useState([])
  const [serialPort, setSerialPort] = useState(null); const [serialError, setSerialError] = useState("")
  const serialRef = useRef(null); const serialWriter = useRef(null)
  useEffect(() => {
    labAPI.getProfiles().then(({ data }) => setProfiles(data.profiles || [])).catch(() => {})
    plantsAPI.getUserScans(1, 50).then(({ data }) => setScans(data.scans || [])).catch(() => {})
    labAPI.getReadings().then(({ data }) => setReadings(data.readings || [])).catch(() => {})
    labAPI.getExperiments().then(({ data }) => setExperiments(data.experiments || [])).catch(() => {})
    if ("serviceWorker" in navigator && import.meta.env.PROD) navigator.serviceWorker.register("/service-worker.js").catch(() => {})
    return () => {
      const connected = serialRef.current
      if (connected) {
        const writer = connected.port.writable.getWriter()
        writer.write(new TextEncoder().encode(`${JSON.stringify({ type: "actuator", lamp: false, fan: false, pump: false })}\n`))
          .catch(() => {})
          .finally(() => { writer.releaseLock(); connected.reader.cancel().catch(() => {}); connected.port.close().catch(() => {}) })
      }
    }
  }, [])
  const connectSerial = async () => {
    setSerialError("")
    if (!("serial" in navigator)) { setSerialError("Web Serial тек Chromium браузерінде және HTTPS-та жұмыс істейді. Демо өлшемді пайдаланыңыз."); return }
    try {
      const port = await navigator.serial.requestPort(); await port.open({ baudRate: 115200 })
      const reader = port.readable.getReader(); serialRef.current = { port, reader }; setSerialPort(port)
      const decoder = new TextDecoder(); let buffer = ""
      let doneReading = false
      while (!doneReading) {
        const { value, done } = await reader.read(); if (done) { doneReading = true; continue }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split(/\r?\n/); buffer = lines.pop() || ""
        for (const line of lines) {
          const [soilMoisture, lightLux, temperatureC, leafSignal] = line.split(",").map(Number)
          if ([soilMoisture, lightLux, temperatureC, leafSignal].every(Number.isFinite)) {
            const payload = { soilMoisture, lightLux, temperatureC, leafSignal, source: "serial" }
            labAPI.createReading(payload).then(({ data }) => setReadings((current) => [data.reading, ...current].slice(0, 30))).catch(() => {})
          }
        }
      }
      reader.releaseLock(); await port.close(); serialRef.current = null; setSerialPort(null)
    } catch (error) { if (error.name !== "NotFoundError") setSerialError(error.message || "Serial құрылғысына қосыла алмады"); setSerialPort(null) }
  }
  const sendActuator = useCallback(async (state) => {
    try { const writer = serialWriter.current || serialRef.current?.port?.writable?.getWriter(); if (!writer) return; await writer.write(new TextEncoder().encode(`${JSON.stringify({ type: "actuator", ...state })}\n`)); if (!serialWriter.current) writer.releaseLock() } catch { setSerialError("Команда құрылғыға жіберілмеді") }
  }, [])
  const disconnectSerial = async () => { await sendActuator({ lamp: false, fan: false, pump: false }); serialRef.current?.reader?.cancel().catch(() => {}); setSerialPort(null) }
  const selected = tabs.find(([id]) => id === active)
  return <div className="lab-page"><Navbar /><main className="lab-shell">
    <header className="lab-hero"><div><div className="lab-kicker"><span /> ДАЛАЛЫҚ ЗЕРТТЕУ</div><h1>Өсімдік зертханасы</h1><p>Өсімдік туралы жазба, датчик өлшемі, ауа райы және тәжірибе — әр деректің қайдан келгені көрсетіледі.</p></div><Link to="/scan" className="lab-button primary"><Camera size={16} />Өсімдікті тану</Link></header>
    <div className="lab-feature-strip"><div><strong>Нақты</strong><span>камера не датчиктен алынған</span></div><div><strong>Демо</strong><span>сынап көруге арналған үлгі</span></div><div><strong>Болжам</strong><span>AI кеңесі, диагноз емес</span></div></div>
    <div className="lab-layout"><nav className="lab-tabs" aria-label="Зертхана бөлімдері">{tabs.map(([id, label, Icon]) => <button key={id} className={active === id ? "active" : ""} aria-current={active === id ? "page" : undefined} onClick={() => setActive(id)}><Icon size={17} /><span>{label}</span><ChevronRight size={14} /></button>)}</nav><div className="lab-content"><div className="lab-content-heading"><div><span>FIELD NOTEBOOK / 0{tabs.findIndex(([id]) => id === active) + 1}</span><h2>{selected?.[1]}</h2></div><span className="lab-date">{new Date().toLocaleDateString("kk-KZ", { dateStyle: "long" })}</span></div>
      {active === "twin" && <TwinPanel profiles={profiles} setProfiles={setProfiles} scans={scans} />}
      {active === "sensors" && <SensorPanel profiles={profiles} readings={readings} setReadings={setReadings} connectSerial={connectSerial} disconnectSerial={disconnectSerial} serialConnected={Boolean(serialPort)} serialError={serialError} />}
      {active === "weather" && <WeatherPanel />}
      {active === "map" && <Suspense fallback={<div className="lab-empty">Карта жүктелуде…</div>}><MapPanel /></Suspense>}
      {active === "experiments" && <ExperimentsPanel experiments={experiments} setExperiments={setExperiments} />}
      {active === "studio" && <StudioPanel readings={readings} serialConnected={Boolean(serialPort)} sendActuator={sendActuator} />}
      {active === "voice" && <VoicePanel />}
      {active === "offline" && <OfflinePanel />}
    </div></div>
    <footer className="lab-footer"><span>Qaragull Green Lab</span><span>Суреттегі диагноз — көмекші болжам. Қауіпті белгі болса, ботаникке не өсімдік маманына көрініңіз.</span></footer>
  </main></div>
}

export default LabPage
