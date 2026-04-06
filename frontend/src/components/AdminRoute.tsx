import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function AdminRoute() {
  const { user, initialized } = useAuth()
  if (!initialized) return null
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
