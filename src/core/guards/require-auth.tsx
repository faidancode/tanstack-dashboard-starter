import { useEffect } from "react"
import { useNavigate, useLocation } from "@tanstack/react-router"
import { useAuthStore } from "../auth/auth.store"

interface RequireAuthProps {
  children: React.ReactNode
}

/**
 * Route guard that redirects unauthenticated users to /login,
 * preserving the intended URL as a `redirect` search parameter.
 *
 * Usage in a route component:
 *   <RequireAuth><ProtectedPage /></RequireAuth>
 *
 * Prefer using `beforeLoad` in route definitions for server-side-style
 * protection. This component handles in-render checks.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const permissionsLoaded = useAuthStore((s) => s.permissionsLoaded)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (permissionsLoaded && !isAuthenticated) {
      void navigate({ href: `/login?redirect=${encodeURIComponent(location.pathname)}` })
    }
  }, [isAuthenticated, permissionsLoaded, navigate, location.pathname])

  // While initializing, render nothing (or a global spinner in shell.tsx)
  if (!permissionsLoaded) return null

  if (!isAuthenticated) return null

  return <>{children}</>
}
