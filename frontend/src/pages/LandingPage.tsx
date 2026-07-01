import { useState } from 'react'
import { Link } from 'react-router-dom'
import LoginModal from '../components/LoginModal'

const mockEvents = [
  {
    id: 2,
    title: 'Festival de Musique Urbaine',
    date: '15 Juil 2026',
    location: 'Parc des Expositions, Abidjan',
    category: 'cultural',
    price: '5 000 F',
  },
  {
    id: 7,
    title: "Salon de l'Emploi & Carrières",
    date: '10 Juil 2026',
    location: 'Sofitel Abidjan, Plateau',
    category: 'professional',
    price: '15 000 F',
  },
  {
    id: 6,
    title: "Marathon International d'Abidjan",
    date: '9 Août 2026',
    location: 'Place de la République',
    category: 'sports',
    price: '10 000 F',
  },
]

const categoryGradients: Record<string, string> = {
  cultural: 'from-pink-500 to-rose-600',
  sports: 'from-emerald-500 to-teal-600',
  professional: 'from-violet-500 to-purple-600',
  other: 'from-gray-500 to-gray-600',
}

const categoryLabels: Record<string, string> = {
  cultural: 'Culturel',
  sports: 'Sportif',
  professional: 'Professionnel',
  other: 'Autre',
}

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false)

  const scrollToFeatures = () => {
    const el = document.getElementById('features')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <main>
        {/* ========== HERO ========== */}
        <section className="relative overflow-hidden px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/5 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-orange-500/5 blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-medium mb-6 animate-float">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              Propulsé par la technologie temps réel ⚡
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-5 animate-fade-in-up">
              Vivez l'événementiel<br />
              <span className="bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">
                à la vitesse du temps réel.
              </span>
            </h1>

            <p
              className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.15s' }}
            >
              Achetez vos billets en 3 clics ou gérez vos événements de A à Z avec un suivi des ventes
              et un contrôle d'accès instantanés. Conçu pour l'Afrique, propulsé pour le monde.
            </p>

            <div className="flex items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-semibold text-sm shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                Découvrir les événements
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-orange-500 text-orange-600 font-semibold text-sm hover:bg-orange-50 hover:-translate-y-0.5 transition-all duration-300"
              >
                Créer un événement
              </Link>
            </div>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <section id="features" className="px-4 pb-20 md:pb-28">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">The Power of Live</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Tout ce dont vous avez besoin pour vivre et gérer l'événementiel en temps réel.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              <div className="group bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M12 18v-6" />
                    <path d="M9 15h6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Billetterie Express</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Achetez vos billets en un éclair et recevez votre ticket sécurisé instantanément.
                  Finis les longs processus de réservation.
                </p>
              </div>

              <div className="group bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up md:mt-6" style={{ animationDelay: '0.1s' }}>
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M7 16l4-8 4 4 4-6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tableau de Bord Live</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Suivez votre chiffre d'affaires et votre taux de remplissage à la seconde près.
                  Des insights en temps réel pour les organisateurs.
                </p>
              </div>

              <div className="group bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Contrôle d'Accès Fluide</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Scannez les QR codes en un geste le jour J. Notre système fonctionne même
                  avec un réseau instable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========== ÉVÉNEMENTS À L'AFFICHE ========== */}
        <section className="px-4 pb-20 md:pb-28">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 animate-fade-in-up">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Événements à l'affiche</h2>
              <p className="text-sm text-gray-500 mt-2">Les événements qui font parler d'eux en ce moment</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {mockEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setModalOpen(true)}
                  className="group block w-full text-left bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up cursor-pointer"
                >
                  <div
                    className={`aspect-[16/9] bg-gradient-to-br ${categoryGradients[event.category]} flex items-center justify-center`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 6v2" /><path d="M16 6v2" />
                        <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{event.date}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                        {categoryLabels[event.category]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-violet-700 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {event.location}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <span className="text-xs font-semibold text-violet-700">À partir de {event.price}</span>
                      <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-violet-50 group-hover:text-violet-700 transition-colors">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center mt-8 animate-fade-in-up">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                Voir tous les événements
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* ========== FOOTER CTA ========== */}
        <section className="px-4 pb-16">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-violet-600 to-violet-800 rounded-3xl p-10 md:p-14 animate-fade-in-up">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Prêt à passer à la vitesse supérieure ?
            </h2>
            <p className="text-violet-200 text-sm mb-6 max-w-sm mx-auto">
              Rejoignez EVENTPRO CI et transformez votre façon de gérer et vivre l'événementiel.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-white text-violet-700 font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                Se connecter
              </button>
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 pb-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} EVENTPRO CI. Tous droits réservés.
            </p>
          </div>
        </footer>
      </main>

      <LoginModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
