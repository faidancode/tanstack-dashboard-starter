import { create } from "zustand"
import type { AuthUser } from "./auth.type"
import type { PermissionRule } from "../utils/permission.utils"
import { can as canCheck } from "../utils/permission.utils"
import { logger } from "../utils/logger"

/**
 * SECURITY NOTE — Token Storage Strategy:
 *
 * Access Token  → Stored in MEMORY ONLY (this Zustand store).
 *   - Never written to localStorage or sessionStorage.
 *   - Cleared on page refresh; re-acquired via silent refresh.
 *   - Reduces XSS attack surface; an injected script cannot steal the token.
 *
 * Refresh Token → Stored in localStorage (default implementation below).
 *   - Alternative: have the server set an HttpOnly cookie containing the refresh
 *     token. That approach is more secure (JS cannot read HttpOnly cookies) but
 *     requires same-origin or CORS with credentials. To switch to cookies:
 *       1. Remove all localStorage.setItem/getItem calls for REFRESH_TOKEN_KEY.
 *       2. On /auth/refresh call, include `withCredentials: true`.
 *       3. The cookie is sent automatically; no token needed in the request body.
 */
const REFRESH_TOKEN_KEY = "rb_rt"

interface AuthState {
  /** In-memory access token — never persisted. */
  accessToken: string | null
  user: AuthUser | null
  permissions: PermissionRule[]
  permissionsLoaded: boolean
  isAuthenticated: boolean

  // ─── Actions ────────────────────────────────────────────────────────────────
  setSession(token: string, user: AuthUser, permissions: PermissionRule[]): void
  clearSession(): void
  /** Called on app startup — attempts silent refresh using stored refresh token. */
  initialize(): Promise<void>
  /** RBAC check — returns true if the user has permission for action on subject. */
  can(action: string, subject: string): boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  permissions: [],
  permissionsLoaded: false,
  isAuthenticated: false,

  setSession(token, user, permissions) {
    set({
      accessToken: token,
      user,
      permissions,
      permissionsLoaded: true,
      isAuthenticated: true,
    })
  },

  clearSession() {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    set({
      accessToken: null,
      user: null,
      permissions: [],
      permissionsLoaded: false,
      isAuthenticated: false,
    })
  },

  async initialize() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      set({ permissionsLoaded: true })
      return
    }

    try {
      // Lazy import to avoid circular dependency with axios.instance
      const { api } = await import("../http/axios.instance")
      const { buildPermissions } = await import("../utils/permission.utils")
      const response = await api.post<{
        data: {
          accessToken: string
          user: AuthUser
          permissions: string[]
          refreshToken: string
        }
      }>("/auth/refresh", { refreshToken })

      const {
        accessToken,
        user,
        permissions,
        refreshToken: newRefreshToken,
      } = response.data.data
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken)
      get().setSession(accessToken, user, buildPermissions(permissions))
    } catch (err) {
      logger.warn("[auth] Silent refresh failed — clearing session.", err)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      set({ permissionsLoaded: true })
    }
  },

  can(action, subject) {
    return canCheck(get().permissions, action, subject)
  },
}))

/** Store the refresh token (call after successful login). */
export function persistRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

/** Read the refresh token (used by Axios interceptor). */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}
