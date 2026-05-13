import { useAuthStore } from "@/core/auth/auth.store"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { LogOut, User } from "@hugeicons/core-free-icons"

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()

  const handleLogout = useCallback(() => {
    clearSession()
    void navigate({ href: "/login" })
  }, [clearSession, navigate])

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?"

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4",
        className
      )}
    >
      {/* Left: breadcrumb slot (filled by child routes if needed) */}
      <div id="breadcrumb-portal" />

      {/* Right: user info + logout */}
      <div className="ml-auto flex items-center gap-3">
        {user?.role && (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {user.role.displayName}
          </Badge>
        )}

        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-primary">
                {initials}
              </span>
            )}
          </div>

          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium text-foreground">
              {user?.fullName ?? "Guest"}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
        >
          <HugeiconsIcon icon={LogOut} className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

/** Placeholder shown when no user is loaded. */
export function HeaderSkeleton() {
  return (
    <header className="flex h-14 items-center justify-end border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="hidden space-y-1 sm:block">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-2 w-32 animate-pulse rounded bg-muted" />
        </div>
        <HugeiconsIcon
          icon={User}
          className="ml-1 h-4 w-4 text-muted-foreground"
        />
      </div>
    </header>
  )
}
