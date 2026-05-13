import { useState, useEffect } from "react"
import { Link, useMatchRoute } from "@tanstack/react-router"
import type { AppPermission } from "@/core/utils/permission.utils"
import {
  BriefcaseIcon,
  Building02Icon,
  DashboardSquare01Icon,
  Shield01Icon,
  UserCircle02Icon,
  UserGroupIcon,
  ArrowDown01Icon,
  ChevronRight,
  ChevronLeft,
} from "@hugeicons/core-free-icons"

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { useAbility } from "@/core/auth/use.ability.hook"
import { cn } from "@/lib/utils"
import { queryClient } from "@/core/http/query-client"

// ─── Nav Config ──────────────────────────────────────────────────────────────

interface NavChild {
  label: string
  href: string
  permission?: AppPermission
}

interface NavItem {
  label: string
  icon: IconSvgElement
  href?: string
  permission?: AppPermission
  children?: NavChild[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: DashboardSquare01Icon,
    href: "/dashboard",
    permission: "Dashboard:read",
  },
  {
    label: "Employees",
    icon: UserGroupIcon,
    permission: "Employee:read",
    children: [
      {
        label: "All Employees",
        href: "/employees",
        permission: "Employee:read",
      },
      {
        label: "Add Employee",
        href: "/employees/new",
        permission: "Employee:create",
      },
    ],
  },
  {
    label: "Departments",
    icon: Building02Icon,
    href: "/departments",
    permission: "Department:read",
  },
  {
    label: "Positions",
    icon: BriefcaseIcon,
    href: "/positions",
    permission: "Position:read",
  },
  {
    label: "Users",
    icon: UserCircle02Icon,
    permission: "User:read",
    children: [
      { label: "All Users", href: "/users", permission: "User:read" },
      { label: "Add User", href: "/users/new", permission: "User:create" },
    ],
  },
  {
    label: "Roles",
    icon: Shield01Icon,
    permission: "Role:read",
    children: [
      { label: "All Roles", href: "/roles", permission: "Role:read" },
      { label: "Add Role", href: "/roles/new", permission: "Role:create" },
    ],
  },
]

const SIDEBAR_COLLAPSED_KEY = "sidebar_collapsed"

// ─── Sidebar Component ───────────────────────────────────────────────────────

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true"
  })
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const { canDo } = useAbility()
  const matchRoute = useMatchRoute()

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  }, [collapsed])

  const toggleCollapse = () => setCollapsed((c) => !c)

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true
    return canDo(item.permission)
  })

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-15" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
          <HugeiconsIcon
            icon={Shield01Icon}
            className="h-4 w-4 text-primary-foreground"
          />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">
            AdminDash
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto px-2 py-3">
        {visibleItems.map((item) => {
          if (item.children) {
            const visibleChildren = item.children.filter((child) => {
              if (!child.permission) return true
              return canDo(child.permission)
            })
            if (visibleChildren.length === 0) return null

            const isGroupOpen = openGroups.has(item.label)
            const isChildActive = visibleChildren.some((c) =>
              matchRoute({ to: c.href as never, fuzzy: true })
            )

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isChildActive
                      ? "font-medium text-primary"
                      : "text-muted-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    className="h-4 w-4 shrink-0"
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isGroupOpen && "rotate-180"
                        )}
                      />
                    </>
                  )}
                </button>

                {!collapsed && isGroupOpen && (
                  <div className="mt-0.5 ml-6 space-y-0.5 border-l border-border pl-2">
                    {visibleChildren.map((child) => {
                      const isActive = matchRoute({
                        to: child.href as never,
                        fuzzy: true,
                      })
                      return (
                        <Link
                          key={child.href}
                          to={child.href as never}
                          className={cn(
                            "flex items-center rounded-md px-2 py-1.5 text-sm transition-colors",
                            isActive
                              ? "bg-accent font-medium text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                          onMouseEnter={() => {
                            // Prefetch the route's data on hover for instant navigation
                            prefetchRoute(child.href)
                          }}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // Single nav link
          const isActive = item.href
            ? matchRoute({ to: item.href as never, fuzzy: true })
            : false

          return (
            <Link
              key={item.label}
              to={(item.href ?? "#") as never}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={collapsed ? item.label : undefined}
              onMouseEnter={() => {
                if (item.href) prefetchRoute(item.href)
              }}
            >
              <HugeiconsIcon icon={item.icon} className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={toggleCollapse}
          className="flex h-8 w-full items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <HugeiconsIcon icon={ChevronRight} className="h-4 w-4" />
          ) : (
            <HugeiconsIcon icon={ChevronLeft} className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}

/** Prefetch a route's primary list query on sidebar hover. */
function prefetchRoute(href: string): void {
  // Prefetch based on route path
  const routePrefetchMap: Record<string, () => void> = {
    "/departments": () => {
      queryClient
        .prefetchQuery({
          queryKey: ["departments", "list", { page: 1, pageSize: 10 }],
          staleTime: 30_000,
        })
        .catch(() => undefined)
    },
    "/employees": () => {
      queryClient
        .prefetchQuery({
          queryKey: ["employees", "list", { page: 1, pageSize: 10 }],
          staleTime: 30_000,
        })
        .catch(() => undefined)
    },
  }

  routePrefetchMap[href]?.()
}
