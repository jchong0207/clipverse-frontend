import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="container"><p className="muted">Loading…</p></div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}
