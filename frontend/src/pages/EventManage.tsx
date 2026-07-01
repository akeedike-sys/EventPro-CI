import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

interface TicketBreakdown {
  type: string
  quota: number
  sold: number
  available: number
  price: number
  revenue: number
}

interface Participant {
  reservation_id: string
  ticket_code: string
  participant_email: string
  participant_name: string
  ticket_type: string
  quantity: number
  total_price: number
  payment_status: string
}

interface ScanEntry {
  name: string
  ticket: string
  time: string
}

const tabs = [
  { key: 'stats', label: '📊', title: 'Statistiques' },
  { key: 'participants', label: '👥', title: 'Participants' },
  { key: 'scan', label: '🎫', title: 'Contrôle d\'accès' },
]

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function EventManage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('stats')

  // Event detail
  const [event, setEvent] = useState<any>(null)
  const [statsData, setStatsData] = useState<any>(null)

  // Participants
  const [participants, setParticipants] = useState<Participant[]>([])
  const [search, setSearch] = useState('')

  // Scan
  const [scanCount, setScanCount] = useState(0)
  const [scanLog, setScanLog] = useState<ScanEntry[]>([])
  const [scanning, setScanning] = useState(false)
  const [scannedCodes] = useState(new Set<string>())
  const [duplicateAlert, setDuplicateAlert] = useState<{ code: string; firstScan: string } | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchAll = async () => {
      try {
        const evt = await api.get(`/events/${id}/`)
        setEvent(evt.data)

        try {
          const [s, p] = await Promise.all([
            api.get(`/dashboard/event_details/?event_id=${id}`),
            api.get(`/dashboard/event_participants/?event_id=${id}`),
          ])
          setStatsData(s.data)
          setParticipants(p.data.participants || [])
        } catch {
          // fallback if organizer-specific endpoints fail
        }
      } catch {
        navigate('/my-events')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id, navigate])

  const handleScan = () => {
    setScanning(true)
    setDuplicateAlert(null)
    const totalSold = statsData?.capacity_usage?.reserved || 999
    if (scanCount >= totalSold) {
      setScanning(false)
      return
    }
    setTimeout(() => {
      const fakeCodes = [
        'EP-B7D3F2A1', 'EP-C8E4G5H2', 'EP-A1B2C3D4', 'EP-F9G8H7I6',
        'EP-K0L1M2N3', 'EP-P4Q5R6S7', 'EP-T8U9V0W1', 'EP-X2Y3Z4A5',
      ]
      const fakeNames = ['Kouassi A.', 'Koné M.', 'Traoré F.', 'Diallo O.', 'N\'Guessan P.', 'Bamba S.', 'Cissé R.', 'Touré A.']
      const fakeTickets = ['Standard', 'VIP', 'VIP', 'Standard', 'Standard', 'Étudiant', 'Standard', 'VIP']
      const idx = scanLog.length % fakeNames.length
      const code = fakeCodes[idx]

      if (scannedCodes.has(code)) {
        setDuplicateAlert({
          code,
          firstScan: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        })
        setScanning(false)
        return
      }

      scannedCodes.add(code)
      const entry: ScanEntry = {
        name: fakeNames[idx],
        ticket: fakeTickets[idx],
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }
      setScanLog([entry, ...scanLog])
      setScanCount(prev => prev + 1)
      setScanning(false)
    }, 600)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-5">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-12 bg-gray-200 rounded-2xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    )
  }
  if (!event) return null

  const totalSold = statsData?.capacity_usage?.reserved || event.max_capacity || 1
  const percentage = Math.min((scanCount / totalSold) * 100, 100)

  const filteredParticipants = participants.filter((p) => {
    const q = search.toLowerCase()
    return p.participant_name.toLowerCase().includes(q) || p.ticket_code.toLowerCase().includes(q)
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-28">
      {/* Header */}
      <div className="mb-6">
        <Link to="/my-events" className="text-xs text-gray-400 hover:text-violet-600 transition mb-2 inline-block">
          ← Mes événements
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
        <p className="text-sm text-gray-500">
          {event.status_display} — {new Date(event.date_start).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            <span className="hidden md:inline">{t.label} {t.title}</span>
            <span className="md:hidden">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Stats */}
      {tab === 'stats' && (
        <div className="space-y-5">
          {statsData?.ticket_breakdown && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <h2 className="text-sm font-semibold text-gray-900">Ventes par type de billet</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {statsData.ticket_breakdown.map((t: TicketBreakdown, i: number) => {
                  const rate = t.quota > 0 ? Math.round((t.sold / t.quota) * 100) : 0
                  const soldOut = t.available <= 0
                  return (
                    <div key={i} className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{t.type}</span>
                          {soldOut && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Épuisé</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-violet-700">{t.price.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span>{t.sold}/{t.quota} vendus</span>
                        <span>•</span>
                        <span>{t.revenue.toLocaleString()} FCFA</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          soldOut ? 'bg-rose-500' : 'bg-violet-500'
                        }`} style={{ width: `${Math.min(rate, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {statsData?.payment_status && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Statut des paiements</h2>
              <div className="flex gap-4">
                <div className="flex-1 bg-emerald-50 rounded-xl p-3.5 text-center">
                  <p className="text-lg font-bold text-emerald-700">{statsData.payment_status.paid}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Payés</p>
                </div>
                <div className="flex-1 bg-amber-50 rounded-xl p-3.5 text-center">
                  <p className="text-lg font-bold text-amber-700">{statsData.payment_status.pending}</p>
                  <p className="text-[10px] text-amber-600 font-medium">En attente</p>
                </div>
                <div className="flex-1 bg-rose-50 rounded-xl p-3.5 text-center">
                  <p className="text-lg font-bold text-rose-700">{statsData.payment_status.refunded}</p>
                  <p className="text-[10px] text-rose-600 font-medium">Remboursés</p>
                </div>
              </div>
            </div>
          )}

          {statsData?.capacity_usage && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900">Capacité</h2>
                <span className="text-sm font-bold text-gray-900">
                  {statsData.capacity_usage.reserved}/{statsData.capacity_usage.max_capacity}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all"
                  style={{ width: `${Math.min(statsData.capacity_usage.percentage, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{statsData.capacity_usage.percentage}% rempli</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Participants */}
      {tab === 'participants' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">🔍</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou code billet..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
            </div>
            <p className="text-xs text-gray-400 mt-2">{participants.length} participant{participants.length > 1 ? 's' : ''}</p>
          </div>

          {filteredParticipants.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10">
              {search ? 'Aucun résultat' : 'Aucun participant'}
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredParticipants.map((p) => (
                <div key={p.reservation_id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold shrink-0">
                        {p.participant_name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.participant_name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{p.participant_email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block text-xs text-gray-500 text-center min-w-[80px]">
                    {p.ticket_type}
                  </div>
                  <div className="hidden md:block text-xs text-gray-500 text-center min-w-[60px]">
                    {p.quantity}
                  </div>
                  <div className="text-right min-w-0">
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                      p.payment_status === 'Payé' ? 'bg-emerald-100 text-emerald-700' :
                      p.payment_status === 'Remboursé' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{p.payment_status}</span>
                    <p className="text-[9px] text-gray-400 font-mono mt-0.5 truncate max-w-[90px]">{p.ticket_code}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Access Control */}
      {tab === 'scan' && (
        <div className="space-y-5">
          {/* Duplicate alert */}
          {duplicateAlert && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center animate-fade-in">
              <p className="text-2xl mb-1">🚫</p>
              <p className="font-bold text-rose-700 text-sm">Ticket déjà validé !</p>
              <p className="text-xs text-rose-600 mt-1">Code : <span className="font-mono">{duplicateAlert.code}</span></p>
              <p className="text-xs text-rose-500">Premier scan à {duplicateAlert.firstScan}</p>
            </div>
          )}

          {/* Gauge */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-1">Entrées scannées</p>
            <p className="text-3xl font-bold text-violet-700">
              {scanCount} <span className="text-base font-normal text-gray-400">/ {totalSold}</span>
            </p>
            <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden max-w-xs mx-auto">
              <div className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{percentage.toFixed(0)}% des billets vendus</p>
          </div>

          {/* Scan button */}
          <button onClick={handleScan} disabled={scanning}
            className="btn-accent w-full py-4 text-base flex items-center justify-center gap-3 disabled:opacity-50">
            {scanning ? (
              <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-xl">📸</span>
                Scanner un ticket
              </>
            )}
          </button>

          {/* Live feed */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Flux des entrées</h2>
              {scanLog.length > 0 && (
                <span className="text-[10px] text-emerald-600 font-medium">{scanLog.length} scanné{scanLog.length > 1 ? 's' : ''}</span>
              )}
            </div>
            {scanLog.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-10">
                Scanner un ticket pour voir le flux en direct
              </p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {scanLog.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">
                        {entry.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {entry.ticket}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{entry.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
