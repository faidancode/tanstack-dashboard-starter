import { Outlet } from "@tanstack/react-router"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Toaster } from "../ui/sonner"

/**
 * Root application shell.
 * Renders the sidebar + header around the active route's content.
 * Place this as the layout component for the `_dashboard` route group.
 */
export function Shell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Global toast notifications */}
      <Toaster />
    </div>
  )
}
