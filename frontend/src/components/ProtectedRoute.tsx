import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-gray-500">Chargement...</div>
  }

  if (!user) return <Navigate to="/" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return <>{children}</>
}
