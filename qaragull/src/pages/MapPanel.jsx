import { useEffect, useMemo, useRef, useState } from "react"
import * as L from "leaflet"
import "leaflet/dist/leaflet.css"
import { AlertTriangle, CloudSun, Loader2, MapPin, ShieldCheck } from "lucide-react"
import { labAPI } from "../services/api"

function Panel({ title, eyebrow, icon: Icon, children, action }) {
  return <section className="lab-panel"><div className="lab-panel-heading"><div className="lab-panel-title"><span className="lab-icon"><Icon size={18} /></span><div><p className="lab-eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>{action}</div>{children}</section>
}
const kazakhstanBounds = [[40.5, 46], [55.5, 87.5]]
const protectedExamples = [
  { latin: "Tulipa greigii", name: "Грейг қызғалдағы" },
  { latin: "Tulipa kaufmanniana", name: "Кауфман қызғалдағы" },
  { latin: "Tulipa regelii", name: "Регель қызғалдағы" },
  { latin: "Malus sieversii", name: "Сиверс алмасы" },
]
const protectedMatch = (name = "") => {
  const normalized = String(name).toLowerCase().trim()
  if (!normalized) return false
  return protectedExamples.some((item) => normalized.includes(item.latin.toLowerCase()) || normalized.includes(item.name.toLowerCase()))
}

function MapPanel() {
  const mapElement = useRef(null)
  const [observations, setObservations] = useState([])
  const [community, setCommunity] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [shareForm, setShareForm] = useState({ commonName: "", scientificName: "", issue: "", latitude: "", longitude: "", consent: false })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState("")

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const cached = JSON.parse(localStorage.getItem("qaragull-inat-cache") || "null")
        let records = cached?.expires > Date.now() ? cached.records : null
        if (!records) {
          const response = await fetch("https://api.inaturalist.org/v1/observations?place_id=7342&taxon_id=47126&per_page=60&order=desc&order_by=observed_on&photos=true")
          if (!response.ok) throw new Error("iNaturalist дерегі уақытша қолжетімсіз")
          const data = await response.json()
          records = (data.results || []).map((item) => {
            const [lat, lng] = (item.location || "").split(",").map(Number)
            return { lat, lng, name: item.taxon?.preferred_common_name || item.taxon?.name || "Белгісіз түр", latin: item.taxon?.name || "", date: item.observed_on, url: item.uri, photo: item.photos?.[0]?.url?.replace("square", "small") }
          }).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
          localStorage.setItem("qaragull-inat-cache", JSON.stringify({ expires: Date.now() + 60 * 60 * 1000, records }))
        }
        if (active) setObservations(records)
      } catch (loadError) {
        if (active) setError(loadError.message || "Атлас жүктелмеді")
      } finally { if (active) setLoading(false) }
    }
    load()
    labAPI.getCommunity().then(({ data }) => { if (active) setCommunity(data.cells || []) }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!mapElement.current) return undefined
    const map = L.map(mapElement.current, { scrollWheelZoom: false, minZoom: 3 }).setView([48.2, 67.5], 4)
    map.fitBounds(kazakhstanBounds)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map)
    observations.forEach((observation) => {
      const marker = L.circleMarker([observation.lat, observation.lng], { radius: 5, color: "#1c5a43", fillColor: "#8cab57", fillOpacity: 0.85, weight: 1 })
      const popup = document.createElement("div")
      const title = document.createElement("strong")
      title.textContent = observation.name
      popup.append(title, document.createElement("br"))
      const latin = document.createElement("em")
      latin.textContent = observation.latin
      popup.append(latin)
      if (observation.date) { popup.append(document.createElement("br")); const date = document.createElement("span"); date.textContent = observation.date; popup.append(date) }
      marker.bindPopup(popup).addTo(map)
    })
    community.forEach((cell) => {
      L.circleMarker([cell.latitude, cell.longitude], { radius: 15, color: "#bd6853", fillColor: "#d98568", fillOpacity: 0.24, weight: 2 })
        .bindPopup(`${cell.issue}: ${cell.count} бақылау, жуықталған тор ұяшығы`).addTo(map)
    })
    const timer = setTimeout(() => map.invalidateSize(), 100)
    return () => { clearTimeout(timer); map.remove() }
  }, [observations, community])

  const months = useMemo(() => {
    const counts = Array(12).fill(0)
    observations.forEach((item) => { const month = item.date ? new Date(`${item.date}T00:00:00`).getMonth() : -1; if (month >= 0) counts[month] += 1 })
    return counts
  }, [observations])
  const isRare = protectedMatch(`${shareForm.scientificName} ${shareForm.commonName}`)
  const submitObservation = async (event) => {
    event.preventDefault(); setSaving(true); setSaved("")
    try {
      await labAPI.createCommunityObservation({ ...shareForm, latitude: shareForm.latitude || null, longitude: shareForm.longitude || null, consent: shareForm.consent })
      setSaved("Жария бақылау жуық координатпен сақталды.")
      const { data } = await labAPI.getCommunity(); setCommunity(data.cells || [])
      setShareForm({ commonName: "", scientificName: "", issue: "", latitude: "", longitude: "", consent: false })
    } catch (saveError) { setSaved(saveError.response?.data?.error || "Сақтау мүмкін болмады") }
    finally { setSaving(false) }
  }

  return <div className="lab-stack">
    <Panel title="Қазақстан флорасының бақылаулары" eyebrow="FIELD ATLAS · INATURALIST" icon={MapPin} action={<span className="lab-live"><span /> ашық дерек</span>}>
      <p className="lab-copy">Қазақстан бойынша iNaturalist-тегі өсімдік бақылаулары. Нүкте нақты өскен жерге дәл келмеуі мүмкін; сирек түрлер үшін координат құпия сақталады.</p>
      {loading && <div className="lab-status"><Loader2 className="animate-spin" size={16} /> Бақылаулар жүктелуде…</div>}
      {error && <div className="lab-note warning"><AlertTriangle size={16} />{error} · Атлас дерегі 1 сағатқа кэшләнәді.</div>}
      <div className="lab-map" ref={mapElement} aria-label="Қазақстан өсімдіктерінің бақылау картасы" />
      <div className="lab-map-legend"><span><i className="legend-dot" /> iNaturalist бақылауы ({observations.length})</span><span><i className="legend-ring" /> қауымдастықтағы ықтимал ошақ ({community.length})</span></div>
      <p className="lab-source">Дерек: <a href="https://www.inaturalist.org/observations?place_id=7342&taxon_id=47126" target="_blank" rel="noreferrer">iNaturalist Kazakhstan</a> · Карта: © OpenStreetMap</p>
    </Panel>
    <div className="lab-two-col">
      <Panel title="Маусымдық фенология" eyebrow="12 АЙЛЫҚ ШОЛУ" icon={CloudSun}>
        <div className="lab-month-grid">{months.map((count, index) => <div className="lab-month" key={index}><div className="lab-month-bar" style={{ height: `${Math.max(8, count / Math.max(1, ...months) * 70)}px` }} /><span>{new Date(2026, index).toLocaleDateString("kk-KZ", { month: "short" })}</span><small>{count}</small></div>)}</div>
        <p className="lab-muted">iNaturalist бақылау күндерінің ай бойынша бөлінісі. Бұл өсімдіктің дәл гүлдеу күнін көрсетпейді.</p>
      </Panel>
      <Panel title="Сирек түрді қорғау" eyebrow="PRIVACY FIRST" icon={ShieldCheck}>
        <div className="lab-rare-list">{protectedExamples.map((item) => <div className="lab-rare-item" key={item.latin}><span><strong>{item.name}</strong><em>{item.latin}</em></span><ShieldCheck size={17} /></div>)}</div>
        <div className="lab-note warning"><AlertTriangle size={16} />Бұл бастапқы ескерту тізімі толық ресми тізілім емес. Жабайы өсімдікті жұлмаңыз, сирек түрдің нақты координатын жарияламаңыз.</div>
      </Panel>
    </div>
    <Panel title="Бақылауды ерікті бөлісу" eyebrow="АНОНИМДІ ЖУЫҚ КООРДИНАТ" icon={MapPin}>
      <p className="lab-copy">Жариялау — міндетті емес. Координат серверде 0.25° ұяшыққа дөңгелектенеді; карта тек бір ұяшықта 30 күн ішінде кемінде 3 ауру бақылауы жиналса ғана ықтимал ошақ көрсетеді.</p>
      {isRare && <div className="lab-note warning"><ShieldCheck size={16} />Бұл атау қорғалатын түрлердің бастапқы тізіміне ұқсайды. Орналасуды бөлісу өшірілді.</div>}
      <form className="lab-form-grid" onSubmit={submitObservation}>
        <label>Қазақша атауы<input value={shareForm.commonName} onChange={(event) => setShareForm({ ...shareForm, commonName: event.target.value })} required maxLength={255} /></label>
        <label>Ғылыми атауы<input value={shareForm.scientificName} onChange={(event) => setShareForm({ ...shareForm, scientificName: event.target.value })} maxLength={255} /></label>
        <label>Мәселе (ауру/зиянкес)<input value={shareForm.issue} onChange={(event) => setShareForm({ ...shareForm, issue: event.target.value })} placeholder="Белгісіз болса бос қалдырыңыз" /></label>
        <label>Ендік · жуық<input type="number" step="0.01" min="40.5" max="55.5" value={shareForm.latitude} onChange={(event) => setShareForm({ ...shareForm, latitude: event.target.value })} /></label>
        <label>Бойлық · жуық<input type="number" step="0.01" min="46" max="87.5" value={shareForm.longitude} onChange={(event) => setShareForm({ ...shareForm, longitude: event.target.value })} /></label>
        <label className="lab-check"><input type="checkbox" checked={shareForm.consent} onChange={(event) => setShareForm({ ...shareForm, consent: event.target.checked })} /> Жуықталған бақылауды ортақ картаға жіберуге келісемін</label>
        <button className="lab-button primary" disabled={saving || isRare || !shareForm.consent}>{saving ? "Сақталуда…" : "Қауымдастыққа жіберу"}</button>
      </form>
      {saved && <p className="lab-feedback" role="status">{saved}</p>}
    </Panel>
  </div>
}

export default MapPanel
