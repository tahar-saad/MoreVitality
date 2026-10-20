import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function CoachRoute({ children }) {
  const { user, role, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/connexion" replace />
  if (role !== 'coach') return <Navigate to="/espace" replace />

  return children
}
