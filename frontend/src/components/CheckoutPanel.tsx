import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

interface TicketItem {
  id: number
  type_name: string
  type_name_display: string
  price: string
  quantity: number
}

interface Props {
  eventId: number
  eventTitle: string
  tickets: TicketItem[]
  total: number
  onClose: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function CheckoutPanel({ eventId, eventTitle, tickets, total, onClose }: Props) {
  const navigate = useNavigate()
  const cancelledRef = useRef(false)
  const idsRef = useRef<string[]>([])

  const [locking, setLocking] = useState(true)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600)
  const [expired, setExpired] = useState(false)
  const [paid, setPaid] = useState(false)

  const activeTickets = tickets.filter((t) => t.quantity > 0)
  const itemCount = activeTickets.reduce((s, t) => s + t.quantity, 0)

  const cancelAll = useCallback(async () => {
    const ids = idsRef.current
    if (ids.length === 0 || cancelledRef.current) return
    cancelledRef.current = true
    await Promise.allSettled(ids.map((id) => api.post(`/reservations/${id}/cancel/`)))
    idsRef.current = []
  }, [])

  useEffect(() => {
    if (activeTickets.length === 0) {
      setLocking(false)
      setError('Aucun billet sélectionné.')
      return
    }
    cancelledRef.current = false
    idsRef.current = []

    const lock = async () => {
      try {
        const results = await Promise.allSettled(
          activeTickets.map((t) =>
            api.post('/reservations/', {
              event: eventId,
              ticket_type: t.id,
              quantity: t.quantity,
            })
          )
        )

        const ids: string[] = []
        let expiryDate: string | null = null
        let errMsg = ''

        for (const r of results) {
          if (r.status === 'rejected') {
            errMsg = r.reason?.response?.data?.detail
              || r.reason?.response?.data?.non_field_errors?.[0]
              || 'Stock insuffisant. Veuillez réduire votre sélection.'
            break
          }
          const data = r.value.data
          ids.push(data.id)
          if (!expiryDate || data.expires_at < expiryDate) {
            expiryDate = data.expires_at
          }
        }

        if (errMsg) {
          if (ids.length > 0) {
            cancelledRef.current = true
            await Promise.allSettled(ids.map((id) => api.post(`/reservations/${id}/cancel/`)))
            idsRef.current = []
            cancelledRef.current = false
          }
          setError(errMsg)
          setLocking(false)
          return
        }

        idsRef.current = ids
        if (expiryDate) {
          const diff = Math.max(0, Math.floor((new Date(expiryDate).getTime() - Date.now()) / 1000))
          setTimeLeft(diff)
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Erreur lors de la réservation.')
      } finally {
        setLocking(false)
      }
    }

    lock()
    return () => { cancelAll() }
  }, [eventId, activeTickets, cancelAll])

  useEffect(() => {
    if (idsRef.current.length === 0 || expired || paid) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setExpired(true)
          cancelAll()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [expired, paid, cancelAll])

  useEffect(() => {
    if (!expired) return
    const t = setTimeout(() => onClose(), 3000)
    return () => clearTimeout(t)
  }, [expired, onClose])

  const handlePay = async () => {
    const ids = idsRef.current
    if (ids.length === 0) return
    setPaying(true)
    try {
      for (const id of ids) {
        await api.post(`/reservations/${id}/pay/`)
      }
      setPaid(true)
      setTimeout(() => { navigate(0) }, 1200)
    } catch {
      setError('Erreur de paiement.')
    } finally {
      setPaying(false)
    }
  }

  const handleClose = () => {
    if (!paid && !expired) cancelAll()
    onClose()
  }

  const timerClass = timeLeft <= 60 ? 'text-rose-600' : 'text-violet-600'

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-end">
      <div className="panel-overlay absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="panel-slide relative w-full md:max-w-md md:h-full bg-white rounded-t-3xl md:rounded-none md:rounded-l-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-900 text-base">
              {expired ? 'Réservation expirée' : paid ? 'Paiement réussi' : 'Finaliser la réservation'}
            </h2>
            {idsRef.current.length > 0 && !expired && !paid && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 ${timerClass} tabular-nums`}>
                {formatTime(timeLeft)}
              </span>
            )}
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition text-sm">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {locking ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="inline-block w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Verrouillage des billets...</p>
            </div>
          ) : expired ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl">⏰</p>
              <p className="font-semibold text-gray-900">Le panier a expiré</p>
              <p className="text-sm text-gray-500">Les billets ont été remis en vente.</p>
            </div>
          ) : paid ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl">🎉</p>
              <p className="font-semibold text-gray-900">Paiement réussi !</p>
              <p className="text-sm text-gray-500">{idsRef.current.length} réservation{idsRef.current.length > 1 ? 's' : ''} confirmée{idsRef.current.length > 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-400">Redirection...</p>
            </div>
          ) : error && idsRef.current.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-4xl">😕</p>
              <p className="text-sm text-rose-600">{error}</p>
              <button onClick={handleClose} className="btn-primary text-sm px-6 py-2.5">Fermer</button>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              {/* Recap */}
              <div className="bg-violet-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">Récapitulatif</p>
                <p className="text-sm font-semibold text-gray-900">{eventTitle}</p>
                {activeTickets.map((t) => (
                  <div key={t.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.type_name_display} × {t.quantity}</span>
                    <span className="font-medium text-gray-900">{(Number(t.price) * t.quantity).toLocaleString()} FCFA</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-violet-200 pt-2 text-sm">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-violet-700">{total.toLocaleString()} FCFA</span>
                </div>
              </div>

              {error && <p className="text-rose-500 text-xs text-center bg-rose-50 py-2 rounded-lg">{error}</p>}

              <button onClick={handlePay} disabled={paying}
                className="btn-accent w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {paying ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Paiement en cours...
                  </>
                ) : (
                  <>Payer {total.toLocaleString()} FCFA</>
                )}
              </button>

              <div className="flex justify-center gap-4 text-2xl opacity-40">
                <span title="Orange Money">🟠</span>
                <span title="MTN Mobile Money">🔵</span>
                <span title="Wave">💚</span>
                <span title="Carte bancaire">💳</span>
              </div>

              <p className="text-[10px] text-gray-400 text-center">Paiement fictif • aucun débit réel</p>
              <p className="text-[10px] text-gray-300 text-center">Réservation verrouillée {formatTime(timeLeft)} — les billets te sont réservés</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
