import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginModal from './LoginModal'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const scrollToFeatures = () => {
    setMenuOpen(false)
    if (window.location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-white text-xs font-bold">
              EP
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight hidden sm:block">EVENTPRO CI</span>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <button onClick={scrollToFeatures}
                  className="px-3.5 py-2 text-xs font-medium text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-all duration-200">
                  Fonctionnalités
                </button>
                <button onClick={() => { setModalOpen(true) }}
                  className="px-3.5 py-2 text-xs font-medium text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-all duration-200">
                  Événements
                </button>
              </>
            ) : (
              <>
                <Link to="/events"
                  className="px-3.5 py-2 text-xs font-medium text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-all duration-200">
                  Événements
                </Link>
                {(user.role === 'organizer') && (
                  <>
                    <Link to="/dashboard"
                      className="px-3.5 py-2 text-xs font-medium text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-all duration-200">
                      Dashboard
                    </Link>
                    <Link to="/my-events"
                      className="px-3.5 py-2 text-xs font-medium text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-all duration-200">
                      Mes événements
                    </Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin"
                    className="px-3.5 py-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200">
                    Administration
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <button
                  onClick={() => setModalOpen(true)}
                  className="hidden sm:inline-flex text-xs font-medium text-gray-600 hover:text-violet-700 transition px-3 py-1.5 rounded-lg hover:bg-violet-50"
                >
                  Se connecter
                </button>
                <Link
                  to="/register"
                  className="text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 transition px-3.5 py-1.5 rounded-lg shadow-sm shadow-violet-200"
                >
                  S'inscrire
                </Link>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="md:hidden w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    {menuOpen ? (
                      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    ) : (
                      <><path d="M2 4h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <>
                {/* User info */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 ml-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div className="hidden lg:block text-right leading-tight">
                    <p className="text-[11px] font-medium text-gray-900 truncate max-w-[90px]">
                      {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}
                    </p>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                      user.role === 'organizer' ? 'text-violet-700 bg-violet-100' :
                      user.role === 'admin' ? 'text-emerald-700 bg-emerald-100' :
                      'text-orange-700 bg-orange-100'
                    }`}>
                      {user.role === 'organizer' ? 'Orga.' : user.role === 'admin' ? 'Admin' : 'Part.'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Déconnexion"
                  className="text-xs text-gray-400 hover:text-rose-600 transition px-2 py-1.5 rounded-lg hover:bg-rose-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
                  </svg>
                </button>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="md:hidden w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    {menuOpen ? (
                      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    ) : (
                      <><path d="M2 4h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>
                    )}
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 animate-fade-in">
            {user && (
              <div className="flex items-center gap-3 px-1 py-3 mb-2 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}</p>
                  <span className={`text-xs font-medium ${
                    user.role === 'organizer' ? 'text-violet-700' :
                    user.role === 'admin' ? 'text-emerald-700' : 'text-orange-700'
                  }`}>
                    {user.role === 'organizer' ? 'Organisateur' : user.role === 'admin' ? 'Administrateur' : 'Participant'}
                  </span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              {!user ? (
                <>
                  <button onClick={() => { scrollToFeatures(); setMenuOpen(false) }}
                    className="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition text-left">
                    Fonctionnalités
                  </button>
                  <button onClick={() => { setModalOpen(true); setMenuOpen(false) }}
                    className="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition text-left">
                    Événements
                  </button>
                  <button onClick={() => { setModalOpen(true); setMenuOpen(false) }}
                    className="mt-2 px-3 py-2.5 text-sm font-medium text-violet-700 bg-violet-50 rounded-xl transition text-left">
                    Se connecter
                  </button>
                </>
              ) : (
                <>
                  <Link to="/events" onClick={() => setMenuOpen(false)}
                    className="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition text-left">
                    Événements
                  </Link>
                  {user.role === 'organizer' && (
                    <>
                      <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                        className="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition text-left">
                        Dashboard
                      </Link>
                      <Link to="/my-events" onClick={() => setMenuOpen(false)}
                        className="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition text-left">
                        Mes événements
                      </Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)}
                      className="px-3 py-2.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition text-left">
                      Administration
                    </Link>
                  )}
                  {user.role !== 'organizer' && (
                    <Link to="/my-reservations" onClick={() => setMenuOpen(false)}
                      className="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition text-left">
                      Mes billets
                    </Link>
                  )}
                  <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                    className="mt-2 px-3 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 rounded-xl transition text-left">
                    Déconnexion
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <LoginModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
