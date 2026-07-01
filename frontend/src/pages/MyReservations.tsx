import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function MyReservations() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)

  const fetchReservations = () => {
    api.get('/reservations/my_reservations/')
      .then((res) => setReservations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchReservations() }, [])

  const handlePay = async (id: string) => {
    setPayingId(id)
    try {
      await api.post(`/reservations/${id}/pay/`)
      fetchReservations()
    } catch {
      alert('Erreur de paiement.')
    } finally {
      setPayingId(null)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Annuler cette réservation ?')) return
    await api.post(`/reservations/${id}/cancel/`)
    fetchReservations()
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement...</div>

  if (user?.role === 'organizer') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-3xl mb-3">🔒</p>
        <p className="text-gray-400 text-sm">Cette section est réservée aux participants.</p>
        <Link to="/dashboard" className="inline-block mt-4 text-sm text-violet-600 font-medium hover:underline">Retour au tableau de bord</Link>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  const paymentColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    refunded: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mes réservations</h1>
      {reservations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">Vous n'avez aucune réservation.</p>
          <Link to="/" className="text-indigo-600 hover:underline">Voir les événements</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{r.event_title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {r.ticket_type_display} — {r.quantity} billet(s)
                  </p>
                  <p className="text-sm text-gray-400">{r.ticket_code}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[r.status]}`}>
                      {r.status_display}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${paymentColors[r.payment_status]}`}>
                      {r.payment_status_display}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-indigo-600 mt-2">
                    {Number(r.total_price).toLocaleString()} FCFA
                  </p>
                </div>
                <div className="flex gap-2">
                  {r.payment_status === 'pending' && r.status !== 'cancelled' && (
                    <button onClick={() => handlePay(r.id)} disabled={payingId === r.id}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
                      {payingId === r.id ? (
                        <><span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Paiement...</>
                      ) : 'Payer'}
                    </button>
                  )}
                  {!r.is_cancelled && (
                    <button onClick={() => handleCancel(r.id)}
                      className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition">
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
