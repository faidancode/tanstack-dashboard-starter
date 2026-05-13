import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useAuthStore } from "../auth/auth.store"
import type { AppPermission } from "../utils/permission.utils"

interface RequirePermissionProps {
  /** A single permission or an array; the user must have ALL listed permissions. */
  permission: AppPermission | AppPermission[]
  /** If true, redirect to /forbidden instead of rendering inline fallback. */
  redirect?: boolean
  /** Custom fallback to render when permission is denied (and redirect is false). */
  fallback?: React.ReactNode
  children: React.ReactNode
}

function ForbiddenInline() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-6xl">🚫</span>
      <h2 className="mt-4 text-xl font-semibold text-foreground">
        Access Denied
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You don&apos;t have permission to view this content.
      </p>
    </div>
  )
}

/**
 * Conditionally renders children based on RBAC permissions.
 *
 * @example
 * <RequirePermission permission="Employee:create">
 *   <CreateButton />
 * </RequirePermission>
 */
export function RequirePermission({
  permission,
  redirect = false,
  fallback,
  children,
}: RequirePermissionProps) {
  const can = useAuthStore((s) => s.can)
  const navigate = useNavigate()

  const permissions = Array.isArray(permission) ? permission : [permission]
  const hasPermission = permissions.every((p) => {
    const sep = p.includes(":") ? ":" : "."
    const [subject, action] = p.split(sep)
    if (!subject || !action) return false
    return can(action, subject)
  })

  useEffect(() => {
    if (!hasPermission && redirect) {
      void navigate({ href: "/forbidden" })
    }
  }, [hasPermission, redirect, navigate])

  if (!hasPermission) {
    if (redirect) return null
    return <>{fallback ?? <ForbiddenInline />}</>
  }

  return <>{children}</>
}
