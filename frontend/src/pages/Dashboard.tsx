import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

interface RecentReservation {
  id: string
  participant_name: string
  event_title: string
  ticket_type: string
  quantity: number
  total_price: number
  payment_status: string
  created_at: string
}

interface Stats {
  total_events: number
  published_events: number
  total_reservations: number
  total_tickets_sold: number
  total_revenue: number
  total_capacity: number
  fill_rate: number
  recent_reservations: RecentReservation[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'À l\'instant'
  if (mins === 1) return 'Il y a 1 min'
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours === 1) return 'Il y a 1 h'
  if (hours < 24) return `Il y a ${hours} h`
  return `Il y a ${Math.floor(hours / 24)} j`
}

const chartDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const chartValues = [35, 52, 28, 74, 61, 88, 43]
const maxVal = Math.max(...chartValues)

const paymentColors: Record<string, string> = {
  'Payé': 'bg-green-500',
  'En attente': 'bg-amber-400',
  'Remboursé': 'bg-rose-400',
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/organizer_stats/')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
        </div>
      </div>
    )
  }
  if (!stats) {
    return <div className="text-center py-20 text-red-500 text-sm">Accès refusé</div>
  }

  const activeEvents = stats.published_events

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue globale de ton activité</p>
        </div>
        <Link to="/events/new"
          className="btn-primary text-xs px-4 py-2.5">
          + Nouvel événement
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Chiffre d'affaires</p>
          <p className="text-xl md:text-2xl font-bold text-violet-700">
            {stats.total_revenue.toLocaleString()} FCFA
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Toutes ventes confondues</p>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Billets vendus</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            {stats.total_tickets_sold}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">{stats.total_reservations} réservation{stats.total_reservations > 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Taux de remplissage</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.fill_rate}%</p>
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.fill_rate, 100)}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{stats.total_tickets_sold}/{stats.total_capacity} places</p>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Événements actifs</p>
          <p className="text-xl md:text-2xl font-bold text-emerald-600">{activeEvents}</p>
          <p className="text-[10px] text-gray-400 mt-1">{stats.total_events} au total</p>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="md:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Évolution des ventes (7 jours)</h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {chartDays.map((day, i) => {
              const height = (chartValues[i] / maxVal) * 100
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-medium">{chartValues[i]}</span>
                  <div className="w-full bg-gray-100 rounded-lg overflow-hidden" style={{ height: '120px' }}>
                    <div className="w-full bg-gradient-to-t from-violet-500 to-violet-400 rounded-lg transition-all duration-700"
                      style={{ height: `${height}%`, marginTop: `${100 - height}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500">{day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="md:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Activité récente</h2>
          {stats.recent_reservations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Aucune activité récente</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_reservations.map((r) => (
                <div key={r.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-bold shrink-0">
                    {r.participant_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-900 font-medium truncate">
                      {r.participant_name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {r.quantity} {r.ticket_type} — <span className="font-medium text-gray-700">{r.total_price.toLocaleString()} FCFA</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(r.created_at)}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${paymentColors[r.payment_status] || 'bg-gray-300'} shrink-0 mt-1.5`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
