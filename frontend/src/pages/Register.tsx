import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '', first_name: '', last_name: '',
    password: '', password_confirm: '', role: 'participant',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      await register(form)
      navigate('/login', { state: { success: 'Compte créé avec succès ! Connectez-vous.' } })
    } catch (err: any) {
      setError(err.response?.data?.email?.[0] || "Erreur lors de l'inscription.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
            EP
          </div>
          <h1 className="text-xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-sm text-gray-500 mt-1">Rejoins EVENTPRO CI dès maintenant</p>
        </div>

        {error && (
          <p className="text-rose-500 text-xs text-center mb-4 bg-rose-50 py-2.5 rounded-xl">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Prénom</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              placeholder="exemple@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Mot de passe</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={8}
              placeholder="8 caractères minimum"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirmer le mot de passe</label>
            <input type="password" name="password_confirm" value={form.password_confirm} onChange={handleChange} required minLength={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Je suis</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition bg-white">
              <option value="participant">Participant — je veux assister à des événements</option>
              <option value="organizer">Organisateur — je veux créer des événements</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50">
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-violet-600 font-medium hover:text-violet-700 transition">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
