import { useState, useEffect } from 'react'
import api from '../api/axios'

interface PlatformStats {
  total_users: number
  total_events: number
  total_reservations: number
  total_revenue: number
  events_by_status: Record<string, number>
  events_by_category: Record<string, number>
  users_by_role: Record<string, number>
  recent_users: {
    id: number; email: string; first_name: string; last_name: string
    role: string; role_display: string; created_at: string
  }[]
  recent_reservations: {
    id: string; participant_name: string; participant_email: string
    event_title: string; event_id: number; ticket_type: string
    quantity: number; total_price: number; payment_status: string; created_at: string
  }[]
  revenue_by_month: { month: string; total: number }[]
  reservations_by_month: { month: string; count: number }[]
  top_organizers: {
    id: number; email: string; first_name: string; last_name: string
    event_count: number; tickets_sold: number; revenue: number
  }[]
}

const roleColors: Record<string, string> = {
  admin: 'bg-emerald-500',
  organizer: 'bg-violet-500',
  participant: 'bg-orange-400',
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-400',
  published: 'bg-emerald-500',
  cancelled: 'bg-rose-500',
  completed: 'bg-blue-500',
}

const categoryLabels: Record<string, string> = {
  cultural: 'Culturel',
  sports: 'Sportif',
  professional: 'Professionnel',
  other: 'Autre',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins === 1) return 'Il y a 1 min'
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours === 1) return 'Il y a 1 h'
  if (hours < 24) return `Il y a ${hours} h`
  return `Il y a ${Math.floor(hours / 24)} j`
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/platform_stats/')
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

  const roleEntries = Object.entries(stats.users_by_role)
  const statusEntries = Object.entries(stats.events_by_status)
  const categoryEntries = Object.entries(stats.events_by_category).filter(([, v]) => v > 0)
  const maxRoleCount = Math.max(...roleEntries.map(([, v]) => v), 1)
  const maxStatusCount = Math.max(...statusEntries.map(([, v]) => v), 1)

  const maxRevenue = Math.max(...stats.revenue_by_month.map((r) => r.total), 1)
  const maxReservations = Math.max(...stats.reservations_by_month.map((r) => r.count), 1)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-bold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vue globale de la plateforme</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Utilisateurs</p>
          <p className="text-xl md:text-2xl font-bold text-violet-700">{stats.total_users}</p>
          <p className="text-[10px] text-gray-400 mt-1">Inscrits sur la plateforme</p>
        </div>
        <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Événements</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total_events}</p>
          <p className="text-[10px] text-gray-400 mt-1">{stats.events_by_status.published} publiés</p>
        </div>
        <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Réservations</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total_reservations}</p>
          <p className="text-[10px] text-gray-400 mt-1">Non annulées</p>
        </div>
        <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Revenus</p>
          <p className="text-xl md:text-2xl font-bold text-emerald-700">
            {stats.total_revenue.toLocaleString()} FCFA
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Toutes ventes</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Revenue by Month */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenus par mois</h2>
          {stats.revenue_by_month.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="flex items-end justify-between gap-2 h-36">
              {stats.revenue_by_month.map((item) => {
                const height = (item.total / maxRevenue) * 100
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {(item.total / 1000).toFixed(0)}k
                    </span>
                    <div className="w-full bg-violet-100 rounded-lg overflow-hidden" style={{ height: '110px' }}>
                      <div className="w-full bg-gradient-to-t from-violet-500 to-violet-400 rounded-lg transition-all duration-700"
                        style={{ height: `${height}%`, marginTop: `${100 - height}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500">{item.month}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Reservations by Month */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Réservations par mois</h2>
          {stats.reservations_by_month.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="flex items-end justify-between gap-2 h-36">
              {stats.reservations_by_month.map((item) => {
                const height = (item.count / maxReservations) * 100
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-medium">{item.count}</span>
                    <div className="w-full bg-orange-100 rounded-lg overflow-hidden" style={{ height: '110px' }}>
                      <div className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-lg transition-all duration-700"
                        style={{ height: `${height}%`, marginTop: `${100 - height}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500">{item.month}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Distribution Row */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Users by Role */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Utilisateurs par rôle</h2>
          <div className="space-y-3">
            {roleEntries.map(([role, count]) => {
              const width = (count / maxRoleCount) * 100
              return (
                <div key={role}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium capitalize">{role}</span>
                    <span className="text-gray-900 font-semibold">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${roleColors[role] || 'bg-gray-500'}`}
                      style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Events by Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Événements par statut</h2>
          <div className="space-y-3">
            {statusEntries.map(([status, count]) => {
              const width = (count / maxStatusCount) * 100
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium capitalize">{status}</span>
                    <span className="text-gray-900 font-semibold">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${statusColors[status] || 'bg-gray-500'}`}
                      style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Events by Category */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Événements par catégorie</h2>
          <div className="space-y-3">
            {categoryEntries.map(([cat, count]) => {
              const total = categoryEntries.reduce((s, [, v]) => s + v, 0) || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{categoryLabels[cat] || cat}</span>
                    <span className="text-gray-900 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity Row */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Derniers inscrits</h2>
          {stats.recent_users.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Aucun utilisateur</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-bold shrink-0">
                    {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-900 font-medium truncate">
                      {u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.email}
                    </p>
                    <p className="text-[10px] text-gray-500">{u.email}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                    u.role === 'organizer' ? 'text-violet-700 bg-violet-100' :
                    u.role === 'admin' ? 'text-emerald-700 bg-emerald-100' :
                    'text-orange-700 bg-orange-100'
                  }`}>
                    {u.role_display}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reservations */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Dernières réservations</h2>
          {stats.recent_reservations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Aucune réservation</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.recent_reservations.map((r) => (
                <div key={r.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-bold shrink-0">
                    {r.participant_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-900 font-medium truncate">{r.participant_name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{r.event_title}</p>
                    <p className="text-[10px] text-gray-400">
                      {r.quantity} {r.ticket_type} — <span className="font-medium text-gray-700">{r.total_price.toLocaleString()} FCFA</span>
                    </p>
                    <p className="text-[10px] text-gray-400">{timeAgo(r.created_at)}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                    r.payment_status === 'Payé' ? 'bg-green-500' :
                    r.payment_status === 'En attente' ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Organizers */}
      {stats.top_organizers.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top organisateurs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Organisateur</th>
                  <th className="pb-2 font-medium text-right">Événements</th>
                  <th className="pb-2 font-medium text-right">Billets vendus</th>
                  <th className="pb-2 font-medium text-right">Revenus</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_organizers.map((o, idx) => (
                  <tr key={o.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 text-gray-400 font-medium">{idx + 1}</td>
                    <td className="py-2.5">
                      <span className="text-gray-900 font-medium">
                        {o.first_name ? `${o.first_name} ${o.last_name || ''}`.trim() : o.email}
                      </span>
                      <span className="text-gray-400 ml-1">({o.email})</span>
                    </td>
                    <td className="py-2.5 text-right text-gray-900">{o.event_count}</td>
                    <td className="py-2.5 text-right text-gray-900">{o.tickets_sold}</td>
                    <td className="py-2.5 text-right text-emerald-700 font-semibold">{o.revenue.toLocaleString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
