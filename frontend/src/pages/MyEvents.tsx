import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

interface EventItem {
  id: number
  title: string
  date_start: string
  location: string
  max_capacity: number
  available_seats: number
  status: string
  status_display: string
  category: string
  image: string | null
}

const statusConfig: Record<string, { bg: string; dot: string }> = {
  draft: { bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  published: { bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  completed: { bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
}

const categoryGradients: Record<string, string> = {
  cultural: 'from-violet-500 to-pink-500',
  sports: 'from-blue-500 to-teal-500',
  professional: 'from-orange-500 to-rose-500',
  other: 'from-gray-400 to-gray-600',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MyEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = () => {
    api.get('/events/my_events/')
      .then((res) => setEvents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEvents() }, [])

  const handlePublish = async (id: number) => {
    await api.post(`/events/${id}/publish/`)
    fetchEvents()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet événement ?')) return
    await api.delete(`/events/${id}/`)
    fetchEvents()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes événements</h1>
          <p className="text-sm text-gray-500 mt-0.5">{events.length} événement{events.length > 1 ? 's' : ''}</p>
        </div>
        <Link to="/events/new"
          className="btn-primary text-xs px-4 py-2.5">
          + Créer
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🎪</p>
          <p className="text-gray-400 text-sm mb-4">Tu n'as encore créé aucun événement</p>
          <Link to="/events/new" className="text-violet-600 text-sm font-medium hover:underline">
            Créer mon premier événement
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => {
            const cfg = statusConfig[evt.status] || statusConfig.draft
            const grad = categoryGradients[evt.category] || categoryGradients.other
            const isDraft = evt.status === 'draft'
            const isMutable = evt.status !== 'cancelled' && evt.status !== 'completed'

            return (
              <div key={evt.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex">
                  {/* Thumbnail */}
                  <div className="w-24 md:w-36 shrink-0 relative overflow-hidden">
                    {evt.image ? (
                      <img src={evt.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center text-2xl`}>
                        🎪
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3.5 md:p-5 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-gray-900 text-sm md:text-base truncate">{evt.title}</h2>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          📅 {formatDate(evt.date_start)} — 📍 {evt.location}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${cfg.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {evt.status_display}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 md:mt-4 gap-2">
                      <div className="flex items-center gap-2 md:gap-3">
                        {isDraft && (
                          <button onClick={() => handlePublish(evt.id)}
                            className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                            Publier
                          </button>
                        )}
                        <button onClick={() => handleDelete(evt.id)}
                          className="text-xs text-gray-400 hover:text-rose-600 px-2 py-1.5 transition">
                          🗑️
                        </button>
                      </div>
                      <button onClick={() => navigate(`/events/${evt.id}/manage`)}
                        className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-xl transition shadow-sm">
                        Gérer l'événement
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
