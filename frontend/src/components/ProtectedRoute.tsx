import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredRole?: 'admin' | 'viewer'
}

export function ProtectedRoute({
  children,
  requiredRole = 'viewer',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If an admin role is required, verify user role
  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
