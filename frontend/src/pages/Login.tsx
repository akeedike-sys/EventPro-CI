import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const successMsg = (location.state as any)?.success
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const profile = await login(email, password)
      const redirect = profile.role === 'admin' ? '/admin' : profile.role === 'organizer' ? '/dashboard' : '/events'
      navigate(redirect, { replace: true })
    } catch {
      setError('Email ou mot de passe incorrect.')
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
          <h1 className="text-xl font-bold text-gray-900">Content de te revoir</h1>
          <p className="text-sm text-gray-500 mt-1">Connecte-toi pour accéder à tes réservations</p>
        </div>

        {successMsg && (
          <p className="text-emerald-600 text-xs text-center mb-4 bg-emerald-50 py-2.5 rounded-xl">{successMsg}</p>
        )}
        {error && (
          <p className="text-rose-500 text-xs text-center mb-4 bg-rose-50 py-2.5 rounded-xl">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="exemple@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-gray-50 focus:bg-white" />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-violet-600 font-medium hover:text-violet-700 transition">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
