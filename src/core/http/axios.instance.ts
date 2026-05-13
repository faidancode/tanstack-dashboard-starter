import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { logger } from "../utils/logger"
import { env } from "@/env"

/**
 * Axios instance with a full interceptor chain:
 *
 * REQUEST:  Attaches `Authorization: Bearer <accessToken>` from the Zustand store.
 * RESPONSE: On 401 → attempts one silent refresh; queues concurrent requests during refresh.
 *           On 403 → navigates to /forbidden.
 *           On network error → shows a toast.
 */
export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
})

// ─── Refresh queue ───────────────────────────────────────────────────────────
// Prevents multiple concurrent calls to /auth/refresh when several requests
// return 401 simultaneously. All requests that arrive while a refresh is in
// progress are queued and replayed once the new token is available.

let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else if (token) {
      resolve(token)
    }
  })
  refreshQueue = []
}

// ─── Request interceptor ─────────────────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lazy import avoids circular dependency; auth store is a singleton so this is safe.
    const { useAuthStore } =
      require("../auth/auth.store") as typeof import("../auth/auth.store")
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

// ─── Response interceptor ────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // ── Network error (no response) ────────────────────────────────────────
    if (!error.response) {
      // Dynamically import toast to avoid circular deps
      logger.error("[http] Network error", error.message)
      // Toast is shown from the global error handler in query-client.ts
      // But surface it here too for non-query requests:
      dispatchToastEvent("Network error. Check your connection.", "error")
      return Promise.reject(error)
    }

    const { status } = error.response

    // ── 401 Unauthorized — attempt token refresh ───────────────────────────
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { getRefreshToken, persistRefreshToken, useAuthStore } =
          await import("../auth/auth.store")
        const { buildPermissions } =
          await import("../utils/permission.utils")
        const storedRefreshToken = getRefreshToken()

        if (!storedRefreshToken) {
          throw new Error("No refresh token available")
        }

        const { data } = await axios.post<{
          data: {
            accessToken: string
            refreshToken: string
            permissions: string[]
            user: import("../auth/auth.type").AuthUser
          }
        }>(`${env.apiUrl}/auth/refresh`, { refreshToken: storedRefreshToken })

        const {
          accessToken,
          refreshToken: newRefreshToken,
          user,
          permissions,
        } = data.data

        // Update in-memory store and persist new refresh token
        useAuthStore
          .getState()
          .setSession(accessToken, user, buildPermissions(permissions))
        persistRefreshToken(newRefreshToken)

        // Replay queued requests
        processQueue(null, accessToken)
        isRefreshing = false

        // Retry the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false

        // Refresh failed — clear session and redirect to login
        const { useAuthStore } = await import("../auth/auth.store")
        useAuthStore.getState().clearSession()
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    // ── 403 Forbidden ──────────────────────────────────────────────────────
    if (status === 403) {
      window.location.href = "/forbidden"
    }

    return Promise.reject(error)
  }
)

// ─── Toast event helper ───────────────────────────────────────────────────────
// Dispatches a custom DOM event that the ToastContainer listens to.
// This avoids importing the React toast system into the Axios layer.

function dispatchToastEvent(
  message: string,
  type: "error" | "warning" | "info"
): void {
  window.dispatchEvent(
    new CustomEvent("app:toast", { detail: { message, type } })
  )
}
