import { useState, useCallback, useEffect } from "react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

type ToastListener = (toasts: Toast[]) => void

// ─── In-module singleton store ────────────────────────────────────────────────
// This allows `toast.success(...)` to be called outside React components
// (e.g. from API mutation callbacks) while still updating React state.

let toasts: Toast[] = []
const listeners: Set<ToastListener> = new Set()

function notify() {
  listeners.forEach((fn) => fn([...toasts]))
}

function addToast(message: string, type: ToastType, duration = 4_000): void {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
  // Max 3 toasts visible at once
  if (toasts.length >= 3) {
    toasts = toasts.slice(-2)
  }
  toasts = [...toasts, { id, message, type, duration }]
  notify()

  setTimeout(() => {
    removeToast(id)
  }, duration)
}

function removeToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

// Public API — call outside of React components (e.g. mutation onSuccess)
export const toast = {
  success: (message: string, duration?: number) =>
    addToast(message, "success", duration),
  error: (message: string, duration?: number) =>
    addToast(message, "error", duration),
  warning: (message: string, duration?: number) =>
    addToast(message, "warning", duration),
  info: (message: string, duration?: number) =>
    addToast(message, "info", duration),
}

// ─── React hook ───────────────────────────────────────────────────────────────

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([...toasts])

  useEffect(() => {
    const listener: ToastListener = (updated) => setCurrentToasts(updated)
    listeners.add(listener)

    // Listen for DOM events dispatched by the Axios interceptor
    const handleDomToast = (e: Event) => {
      const { message, type } = (
        e as CustomEvent<{ message: string; type: ToastType }>
      ).detail
      addToast(message, type)
    }
    window.addEventListener("app:toast", handleDomToast)

    return () => {
      listeners.delete(listener)
      window.removeEventListener("app:toast", handleDomToast)
    }
  }, [])

  const dismiss = useCallback((id: string) => removeToast(id), [])

  return { toasts: currentToasts, dismiss, ...toast }
}
