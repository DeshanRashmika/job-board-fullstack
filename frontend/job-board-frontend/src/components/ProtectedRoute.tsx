import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** If provided, the user must also have this role. */
  requiredRole?: 'EMPLOYER' | 'JOB_SEEKER'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation()
  const token = localStorage.getItem('access_token')
  const role  = localStorage.getItem('role')

  // Not logged in → redirect to /login, preserving the intended destination
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Wrong role → redirect home
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
