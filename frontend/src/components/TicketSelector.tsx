import { useState, useEffect } from 'react'

interface TicketType {
  id: number
  type_name: string
  type_name_display: string
  price: string
  quota: number
  sold: number
  available: number
}

interface Props {
  tickets: TicketType[]
  onChange: (selections: Record<number, number>) => void
}

export default function TicketSelector({ tickets, onChange }: Props) {
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  useEffect(() => {
    const initial: Record<number, number> = {}
    tickets.forEach((t) => { initial[t.id] = 0 })
    setQuantities(initial)
  }, [tickets])

  const update = (id: number, val: number) => {
    const t = tickets.find((t) => t.id === id)
    if (!t) return
    const clamped = Math.max(0, Math.min(val, t.available))
    const next = { ...quantities, [id]: clamped }
    setQuantities(next)
    onChange(next)
  }

  const total = tickets.reduce((sum, t) => sum + Number(t.price) * (quantities[t.id] || 0), 0)
  const hasSelection = Object.values(quantities).some((q) => q > 0)
  const itemCount = Object.values(quantities).reduce((a, b) => a + b, 0)

  const isSoldOut = (t: TicketType) => t.available <= 0
  const isHot = (t: TicketType) => !isSoldOut(t) && t.available < t.quota * 0.2

  return (
    <div className="space-y-3">
      {tickets.map((t) => {
        const qty = quantities[t.id] || 0
        return (
          <div key={t.id} className={`bg-white rounded-xl border p-4 transition-all ${
            qty > 0 ? 'border-violet-300 bg-violet-50/50 shadow-sm' : 'border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{t.type_name_display}</span>
                  {isSoldOut(t) && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Épuisé</span>
                  )}
                  {isHot(t) && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Forte demande</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{t.available} disponible{t.available > 1 ? 's' : ''}</p>
              </div>
              <span className="text-sm font-bold text-violet-700">{Number(t.price).toLocaleString()} FCFA</span>
            </div>
            {!isSoldOut(t) && (
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => update(t.id, qty - 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-violet-300 hover:text-violet-700 transition disabled:opacity-30"
                  disabled={qty <= 0}>
                  −
                </button>
                <span className="w-6 text-center font-semibold text-gray-900 text-sm">{qty}</span>
                <button onClick={() => update(t.id, qty + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-violet-300 hover:text-violet-700 transition disabled:opacity-30"
                  disabled={qty >= t.available}>
                  +
                </button>
              </div>
            )}
          </div>
        )
      })}

      <div className={`fixed bottom-0 inset-x-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-30 transition-all md:static md:p-0 md:border-0 md:shadow-none md:bg-transparent ${
        hasSelection ? 'translate-y-0' : 'translate-y-full md:translate-y-0'
      }`}>
        <button disabled={!hasSelection}
          onClick={() => document.getElementById('checkout-trigger')?.click()}
          className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none">
          <span>Continuer vers le paiement</span>
          <span className="text-white/80">•</span>
          <span className="font-bold">{total.toLocaleString()} FCFA</span>
          <span className="text-white/60 text-xs">({itemCount} billet{itemCount > 1 ? 's' : ''})</span>
        </button>
      </div>
      {hasSelection && <div className="h-20 md:hidden" />}
    </div>
  )
}
