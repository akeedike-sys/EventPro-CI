import { Link } from 'react-router-dom'

interface EventData {
  id: number
  title: string
  date_start: string
  location: string
  max_capacity: number
  available_seats: number
  category: string
  image: string | null
  min_price?: number | null
}

interface Props {
  event: EventData
}

const categoryGradients: Record<string, string> = {
  cultural: 'from-violet-500 to-pink-500',
  sports: 'from-blue-500 to-teal-500',
  professional: 'from-orange-500 to-rose-500',
  other: 'from-gray-400 to-gray-600',
}

const categoryIcons: Record<string, string> = {
  cultural: '🎵',
  sports: '⚽',
  professional: '💼',
  other: '📌',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function EventCard({ event }: Props) {
  const isAlmostFull = event.available_seats > 0 && event.available_seats < event.max_capacity * 0.15
  const isSoldOut = event.available_seats <= 0
  const grad = categoryGradients[event.category] || categoryGradients.other

  return (
    <Link to={`/events/${event.id}`} className="event-card block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="relative aspect-[16/9] overflow-hidden">
        {event.image ? (
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center text-5xl`}>
            {categoryIcons[event.category] || '📌'}
          </div>
        )}
        {isAlmostFull && !isSoldOut && (
          <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
            Bientôt complet
          </span>
        )}
        {isSoldOut && (
          <span className="absolute top-2 left-2 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
            Complet
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute bottom-2 left-3 text-white text-xs font-medium drop-shadow-md">
          {formatDate(event.date_start)} • {formatTime(event.date_start)}
        </span>
      </div>
      <div className="p-3.5">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1.5">
          {event.title}
        </h3>
        <p className="text-xs text-gray-500 truncate mb-2.5">
          📍 {event.location}
        </p>
        <div className="flex items-center justify-between">
          {event.min_price ? (
            <span className="text-sm font-bold text-violet-700">
              {Number(event.min_price).toLocaleString()} FCFA
            </span>
          ) : (
            <span className="text-xs text-gray-400">Voir les tarifs</span>
          )}
          <span className="text-[10px] text-gray-400">
            {event.available_seats}/{event.max_capacity}
          </span>
        </div>
      </div>
    </Link>
  )
}
