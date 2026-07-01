import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

interface TicketTypeInput {
  type_name: string
  price: string
  quota: string
  sale_end: string
}

const ticketTypeOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'vip', label: 'VIP' },
  { value: 'student', label: 'Étudiant' },
]

const categories = [
  { value: 'cultural', label: 'Culturel' },
  { value: 'sports', label: 'Sportif' },
  { value: 'professional', label: 'Professionnel' },
  { value: 'other', label: 'Autre' },
]

const steps = ['Infos générales', 'Date & Lieu', 'Billetterie']

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    title: '', description: '', date_start: '', date_end: '',
    location: '', max_capacity: 100, category: 'other',
  })
  const [tickets, setTickets] = useState<TicketTypeInput[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const evt = await api.get(`/events/${id}/`)
          const d = evt.data
          setForm({
            title: d.title, description: d.description,
            date_start: d.date_start.slice(0, 16), date_end: d.date_end.slice(0, 16),
            location: d.location, max_capacity: d.max_capacity, category: d.category,
          })
          const tck = await api.get(`/ticket-types/?event=${id}`)
          const listData = Array.isArray(tck.data) ? tck.data : (tck.data.results || [])
          setTickets(listData.map((t: any) => ({
            type_name: t.type_name,
            price: String(t.price),
            quota: String(t.quota),
            sale_end: '',
          })))
        } catch {
          navigate('/my-events')
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }
  }, [id, isEdit, navigate])

  const update = (field: string, value: any) => setForm({ ...form, [field]: value })

  const addTicket = () => setTickets([...tickets, { type_name: 'standard', price: '', quota: '', sale_end: '' }])
  const updateTicket = (i: number, field: string, value: string) => {
    const next = [...tickets]
    next[i] = { ...next[i], [field]: value }
    setTickets(next)
  }
  const removeTicket = (i: number) => setTickets(tickets.filter((_, idx) => idx !== i))

  const isEditMode = isEdit
  const canNext = (): boolean => {
    if (step === 0) return form.title.trim().length > 0 && form.description.trim().length > 0
    if (step === 1) {
      if (!form.date_start.length || !form.date_end.length || !form.location.trim().length) return false
      const start = new Date(form.date_start)
      const end = new Date(form.date_end)
      if (end <= start) return false
      if (!isEditMode && start < new Date()) return false
      return true
    }
    if (step === 2) {
      const eventEnd = new Date(form.date_end)
      for (const t of tickets) {
        if (t.sale_end && new Date(t.sale_end) > eventEnd) return false
      }
      return true
    }
    return true
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const basePayload: Record<string, any> = {
        ...form,
        date_start: form.date_start + ':00Z',
        date_end: form.date_end + ':00Z',
        max_capacity: form.max_capacity,
      }

      const sendData = async (url: string, method: 'post' | 'put') => {
        if (imageFile) {
          const fd = new FormData()
          Object.entries(basePayload).forEach(([k, v]) => fd.append(k, String(v)))
          fd.append('image', imageFile)
          return api[method](url, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
        return api[method](url, basePayload)
      }

      if (isEdit) {
        await sendData(`/events/${id}/`, 'put')
      } else {
        const res = await sendData('/events/', 'post')
        const eventId = res.data.id
        for (const t of tickets) {
          if (t.price && t.quota) {
            await api.post('/ticket-types/', {
              event: eventId,
              type_name: t.type_name,
              price: t.price,
              quota: Number(t.quota),
            })
          }
        }
      }
      navigate('/my-events')
    } catch {
      alert("Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 animate-pulse space-y-5">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-32">
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        {isEdit ? "Modifier l'événement" : 'Créer un événement'}
      </h1>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => {
          const isActive = i === step
          const isDone = i < step
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${i > 0 ? 'ml-0' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone ? 'bg-violet-600 text-white' :
                  isActive ? 'bg-violet-600 text-white ring-4 ring-violet-100' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden md:inline ${isActive ? 'text-violet-700' : 'text-gray-400'}`}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-violet-600' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
        {/* Step 1: General Info */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Titre de l'événement</label>
              <input value={form.title} onChange={(e) => update('title', e.target.value)} required maxLength={200}
                placeholder="Ex: Concert de Jazz 2025"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Catégorie</label>
              <select value={form.category} onChange={(e) => update('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white">
                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} required rows={4}
                placeholder="Décris ton événement en quelques lignes..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Affiche (image)</label>
              <input type="file" accept="image/*" ref={fileInputRef} hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setImageFile(file)
                    setPreviewUrl(URL.createObjectURL(file))
                  }
                }} />
              <div onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 hover:border-violet-300 transition cursor-pointer relative overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Aperçu" className="max-h-40 mx-auto rounded-lg object-cover" />
                ) : (
                  <>
                    <p className="text-2xl mb-1">🖼️</p>
                    <p className="text-xs">Glisse une image ici ou clique pour sélectionner</p>
                    <p className="text-[10px] text-gray-300 mt-1">Format 16:9 recommandé</p>
                  </>
                )}
              </div>
              {imageFile && (
                <button onClick={() => { setImageFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="text-xs text-rose-500 mt-2 hover:text-rose-700 transition">
                  Supprimer l'image
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Date & Location */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date de début</label>
                <input type="date" value={form.date_start.slice(0, 10)} min={isEditMode ? undefined : new Date().toISOString().slice(0, 10)} onChange={(e) => {
                  const time = form.date_start.slice(11) || '09:00'
                  update('date_start', e.target.value + 'T' + time)
                }} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Heure de début</label>
                <input type="time" value={form.date_start.slice(11) || ''} onChange={(e) => {
                  const date = form.date_start.slice(0, 10) || new Date().toISOString().slice(0, 10)
                  update('date_start', date + 'T' + e.target.value)
                }} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date de fin</label>
                <input type="date" value={form.date_end.slice(0, 10)} onChange={(e) => {
                  const time = form.date_end.slice(11) || '18:00'
                  update('date_end', e.target.value + 'T' + time)
                }} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Heure de fin</label>
                <input type="time" value={form.date_end.slice(11) || ''} onChange={(e) => {
                  const date = form.date_end.slice(0, 10) || new Date().toISOString().slice(0, 10)
                  update('date_end', date + 'T' + e.target.value)
                }} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
              </div>
            </div>
            {form.date_start && form.date_end && new Date(form.date_end) <= new Date(form.date_start) && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                La date de fin doit être postérieure à la date de début
              </p>
            )}
            {!isEditMode && form.date_start && new Date(form.date_start) < new Date() && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                La date de début ne peut pas être dans le passé
              </p>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Lieu / Adresse</label>
              <input value={form.location} onChange={(e) => update('location', e.target.value)} required maxLength={300}
                placeholder="Ex: Espace Congrès, Abidjan"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Capacité maximale</label>
              <input type="number" value={form.max_capacity} onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                update('max_capacity', isNaN(v) ? 1 : v)
              }} required min={1}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
            </div>
          </div>
        )}

        {/* Step 3: Ticketing */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Ajoute les différents types de billets pour ton événement</p>

            {tickets.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Billet #{i + 1}</span>
                  <button onClick={() => removeTicket(i)}
                    className="text-xs text-rose-500 hover:text-rose-700 transition">
                    Supprimer
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Type</label>
                    <select value={t.type_name} onChange={(e) => updateTicket(i, 'type_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500 outline-none bg-white">
                      {ticketTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Prix (FCFA)</label>
                    <input type="number" value={t.price} onChange={(e) => updateTicket(i, 'price', e.target.value)} required min={0}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500 outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Quota</label>
                    <input type="number" value={t.quota} onChange={(e) => updateTicket(i, 'quota', e.target.value)} required min={1}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500 outline-none bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Fin des ventes (optionnelle)</label>
                  <input type="date" value={t.sale_end} onChange={(e) => updateTicket(i, 'sale_end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500 outline-none bg-white" />
                  {t.sale_end && form.date_end && new Date(t.sale_end) > new Date(form.date_end) && (
                    <p className="text-[10px] text-rose-500 mt-0.5">Ne peut pas dépasser la date de fin de l'événement</p>
                  )}
                </div>
              </div>
            ))}

            <button onClick={addTicket}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-violet-300 hover:text-violet-600 transition flex items-center justify-center gap-2">
              <span className="text-lg">+</span> Ajouter un type de billet
            </button>

            {tickets.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                Aucun billet pour le moment. Tu pourras en ajouter plus tard.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-30">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2.5 transition">
              ← Précédent
            </button>
          ) : (
            <div />
          )}

          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canNext()}
              className="btn-primary text-sm px-6 py-2.5 disabled:opacity-40">
              Suivant →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="btn-accent text-sm px-6 py-2.5 disabled:opacity-50">
              {saving ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : "Créer l'événement")}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
