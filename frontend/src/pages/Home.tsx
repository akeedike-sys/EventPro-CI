import { useState, useEffect } from 'react'
import api from '../api/axios'
import CategoryFilter from '../components/CategoryFilter'
import EventCard from '../components/EventCard'

interface Event {
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

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')

  useEffect(() => {
    api.get('/events/upcoming/')
      .then((res) => setEvents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = category === 'all'
    ? events
    : events.filter((e) => e.category === category)

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Hero */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-gray-900">🔥 Événements populaires</h1>
        <p className="text-sm text-gray-500 mt-0.5">Découvre les meilleurs événements en Côte d'Ivoire</p>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      {/* Event Grid */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-[16/9] bg-gray-200" />
                <div className="p-3.5 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-gray-400 text-sm">Aucun événement dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
