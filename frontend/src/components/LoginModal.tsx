import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'participant' | 'organizer'>('participant')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const resetForm = useCallback(() => {
    setEmail('')
    setPassword('')
    setError('')
    setShowPassword(false)
  }, [])

  useEffect(() => {
    setEmail('')
    setPassword('')
    setError('')
    setShowPassword(false)
  }, [tab])

  useEffect(() => {
    if (!isOpen) return
    resetForm()
    setTab('participant')
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose, resetForm])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const profile = await login(email, password)
      const redirect = profile.role === 'admin' ? '/admin' : profile.role === 'organizer' ? '/dashboard' : '/events'
      navigate(redirect, { replace: true })
      onClose()
    } catch {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />

      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition z-10"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="pt-10 pb-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-white text-lg font-bold mx-auto mb-3 shadow-lg shadow-violet-200">
            EP
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gray-100 rounded-xl p-1 flex relative mb-5">
            <div
              className={`absolute top-1 bottom-1 w-1/2 rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out ${tab === 'organizer' ? 'translate-x-full' : 'translate-x-0'}`}
            />
            <button
              onClick={() => setTab('participant')}
              className={`relative flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${tab === 'participant' ? 'text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Participant
            </button>
            <button
              onClick={() => setTab('organizer')}
              className={`relative flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${tab === 'organizer' ? 'text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Organisateur
            </button>
          </div>

          <div className="transition-all duration-300">
            {tab === 'participant' ? (
              <>
                <p className="text-center text-xs text-gray-500 mb-5">
                  Accédez à vos billets instantanément.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {error && (
                    <p className="text-rose-500 text-xs text-center bg-rose-50 py-2.5 rounded-xl">{error}</p>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      placeholder="exemple@email.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Mot de passe</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-violet-600 hover:text-violet-700 mt-1.5 font-medium transition"
                    >
                      {showPassword ? 'Masquer' : 'Afficher'} le mot de passe
                    </button>
                  </div>
                  <button type="submit" disabled={loading}
                    className="btn-primary w-full py-3 text-sm disabled:opacity-50"
                  >
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="text-center text-xs text-gray-500 mb-5">
                  Pilotez vos événements et analysez vos ventes.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {error && (
                    <p className="text-rose-500 text-xs text-center bg-rose-50 py-2.5 rounded-xl">{error}</p>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      placeholder="exemple@email.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Mot de passe</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-violet-600 hover:text-violet-700 mt-1.5 font-medium transition"
                    >
                      {showPassword ? 'Masquer' : 'Afficher'} le mot de passe
                    </button>
                  </div>
                  <button type="submit" disabled={loading}
                    className="btn-primary w-full py-3 text-sm disabled:opacity-50"
                  >
                    {loading ? 'Connexion...' : 'Entrer dans le Dashboard'}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center mb-2.5 font-medium">Connexion rapide avec un compte test</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@eventpro.ci')
                  setPassword('Admin123!')
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition text-center"
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('organizer@eventpro.ci')
                  setPassword('Pass1234!')
                  setTab('organizer')
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition text-center"
              >
                🎤 Organisateur
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('participant@eventpro.ci')
                  setPassword('Pass1234!')
                  setTab('participant')
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition text-center"
              >
                🎫 Participant
              </button>
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400">
              Pas encore de compte ?{' '}
              <button
                onClick={() => { navigate('/register'); onClose() }}
                className="text-violet-600 font-medium hover:text-violet-700 transition"
              >
                Créer un compte
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
