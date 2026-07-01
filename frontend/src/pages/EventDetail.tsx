import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import TicketSelector from '../components/TicketSelector'
import CheckoutPanel from '../components/CheckoutPanel'

interface EventData {
  id: number
  title: string
  description: string
  date_start: string
  date_end: string
  location: string
  max_capacity: number
  available_seats: number
  status: string
  status_display: string
  category: string
  category_display: string
  image: string | null
  organizer_name?: string
}

interface TicketType {
  id: number
  type_name: string
  type_name_display: string
  price: string
  quota: number
  sold: number
  available: number
}

const categoryGradients: Record<string, string> = {
  cultural: 'from-violet-600 via-purple-600 to-pink-600',
  sports: 'from-blue-600 via-cyan-600 to-teal-600',
  professional: 'from-orange-600 via-rose-600 to-red-600',
  other: 'from-gray-600 to-gray-800',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventData | null>(null)
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selections, setSelections] = useState<Record<number, number>>({})
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get(`/events/${id}/`),
      api.get(`/ticket-types/?event=${id}`),
    ]).then(([evt, tck]) => {
      setEvent(evt.data)
      setTickets(tck.data.results || tck.data)
    }).catch(() => setError("Événement introuvable. Veuillez réessayer plus tard."))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-64 bg-gray-200" />
        <div className="p-4 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mb-4">🔍</div>
        <p className="text-gray-500 text-sm">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-xs text-violet-600 hover:text-violet-700 font-medium transition">
          Retour
        </button>
      </div>
    )
  }
  if (!event) return null

  const grad = categoryGradients[event.category] || categoryGradients.other
  const isPast = new Date(event.date_end) < new Date()
  const activeTickets = tickets
    .filter((t) => (selections[t.id] || 0) > 0)
    .map((t) => ({ ...t, quantity: selections[t.id] || 0 }))
  const total = tickets.reduce((s, t) => s + Number(t.price) * (selections[t.id] || 0), 0)

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-10">
      {/* Banner */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        {event.image ? (
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center text-7xl`}>
            🎪
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-black/30 backdrop-blur-sm flex items-center justify-center text-white text-sm hover:bg-black/50 transition">
          ←
        </button>
        <div className="absolute bottom-0 inset-x-0 p-5">
          <span className="inline-block text-[10px] font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full mb-2">
            {event.category_display}
          </span>
          <h1 className="text-2xl font-bold text-white leading-tight">{event.title}</h1>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 space-y-2.5">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="text-base">📅</span>
          <span className="font-medium">{formatDate(event.date_start)}</span>
          <span className="text-gray-300">|</span>
          <span>{formatTime(event.date_start)}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="text-base">📍</span>
          <span>{event.location}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="text-base">👤</span>
          <span>Organisé par <span className="font-medium text-gray-900">{event.organizer_name || 'Un organisateur'}</span></span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-base">🎫</span>
          <span className="text-gray-600">
            <span className="font-semibold text-violet-700">{event.available_seats}</span>/{event.max_capacity} places disponibles
          </span>
          {isPast && <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-medium">Terminé</span>}
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="px-4 py-4 border-b border-gray-100 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">À propos</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{event.description}</p>
        </div>
      )}

      {/* Ticket Selector */}
      {event.status === 'published' && tickets.length > 0 && !isPast && user?.role !== 'organizer' && (
        <div className="px-4 pt-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Choisis tes billets</h2>
          <TicketSelector tickets={tickets} onChange={setSelections} />
          <button id="checkout-trigger" onClick={() => {
            if (!user) { navigate('/login'); return }
            setShowPanel(true)
          }} className="hidden" />
        </div>
      )}
      {event.status !== 'published' && (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-gray-400">Cet événement n'est pas ouvert à la réservation.</p>
        </div>
      )}
      {isPast && event.status === 'published' && (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-gray-400">Cet événement est déjà passé.</p>
        </div>
      )}
      {event.status === 'published' && !isPast && user?.role === 'organizer' && (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-gray-400">La billetterie est réservée aux participants.</p>
        </div>
      )}

      {/* Checkout Panel */}
      {showPanel && activeTickets.length > 0 && (
        <CheckoutPanel
          eventId={event.id}
          eventTitle={event.title}
          tickets={activeTickets}
          total={total}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  )
}
