import {
  QueryClient,
  type QueryCache,
  type MutationCache,
} from "@tanstack/react-query"
import type { AxiosError } from "axios"
import { logger } from "../utils/logger"

/** Standard API envelope returned by all endpoints. */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

function handleGlobalError(error: unknown): void {
  const axiosError = error as AxiosError<ApiResponse<null>>

  // 401/403 are handled by the Axios interceptor — don't double-toast
  const status = axiosError?.response?.status
  if (status === 401 || status === 403) return

  const message =
    axiosError?.response?.data?.message ??
    (error instanceof Error ? error.message : "An unexpected error occurred")

  logger.error("[query] Unhandled error", error)

  // Dispatch toast event (consumed by ToastContainer)
  window.dispatchEvent(
    new CustomEvent("app:toast", {
      detail: { message, type: "error" },
    })
  )
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      gcTime: 5 * 60 * 1_000, // 5 minutes
      retry: 1, // Fail fast; refresh is handled by the interceptor
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000), // Exponential backoff
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
  queryCache: {
    onError: handleGlobalError,
  } as unknown as QueryCache,
  mutationCache: {
    onError: handleGlobalError,
  } as unknown as MutationCache,
})
