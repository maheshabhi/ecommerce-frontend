import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import LoadingScreen from '@/components/ui/LoadingScreen'

function PublicOnlyRoute() {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) {
    return <LoadingScreen message="Loading account..." />
  }

  if (isAuthenticated) {
    return <Navigate to="/products" replace />
  }

  return <Outlet />
}

export default PublicOnlyRoute
