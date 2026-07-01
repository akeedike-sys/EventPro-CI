import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import EventDetail from './pages/EventDetail'
import Dashboard from './pages/Dashboard'
import MyEvents from './pages/MyEvents'
import EventForm from './pages/EventForm'
import EventManage from './pages/EventManage'
import MyReservations from './pages/MyReservations'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <Routes>
        <Route path="/" element={
          loading ? null : !user ? (
            <LandingPage />
          ) : user.role === 'admin' ? (
            <Navigate to="/admin" replace />
          ) : user.role === 'organizer' ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/events" replace />
          )
        } />
        <Route path="/events" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['organizer']}><Dashboard /></ProtectedRoute>
        } />
        <Route path="/my-events" element={
          <ProtectedRoute roles={['organizer']}><MyEvents /></ProtectedRoute>
        } />
        <Route path="/events/new" element={
          <ProtectedRoute roles={['organizer']}><EventForm /></ProtectedRoute>
        } />
        <Route path="/events/:id/edit" element={
          <ProtectedRoute roles={['organizer']}><EventForm /></ProtectedRoute>
        } />
        <Route path="/events/:id/manage" element={
          <ProtectedRoute roles={['organizer']}><EventManage /></ProtectedRoute>
        } />
        <Route path="/my-reservations" element={
          <ProtectedRoute><MyReservations /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}
