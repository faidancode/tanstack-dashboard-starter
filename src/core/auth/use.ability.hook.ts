import { useAuthStore } from "./auth.store"
import type { AppPermission } from "./auth.type"

/**
 * Hook that exposes a `can` function scoped to the current user's permissions.
 *
 * @example
 * const { can } = useAbility()
 * if (can('create', 'Employee')) { ... }
 */
export function useAbility() {
  const can = useAuthStore((s) => s.can)

  return {
    can,
    /** Convenience: check a single AppPermission string. */
    canDo(permission: AppPermission | string): boolean {
      const sep = permission.includes(":") ? ":" : "."
      const [subject, action] = permission.split(sep)
      if (!subject || !action) return false
      return can(action, subject)
    },
  }
}
