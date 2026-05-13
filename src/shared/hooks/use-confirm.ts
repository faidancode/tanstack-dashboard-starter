import { useState, useCallback } from "react"

interface ConfirmOptions {
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  resolve: ((confirmed: boolean) => void) | null
}

/**
 * Imperative confirmation dialog hook.
 * Returns a `confirm` function that resolves to true/false based on user choice.
 *
 * @example
 * const { confirm, ConfirmDialog } = useConfirm()
 * const ok = await confirm({ title: 'Delete employee?', variant: 'destructive' })
 * if (ok) deleteEmployee(id)
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    resolve: null,
    title: "Are you sure?",
    description: "This action cannot be undone.",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "default",
  })

  const confirm = useCallback(
    (options: ConfirmOptions = {}): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          resolve,
          title: options.title ?? "Are you sure?",
          description: options.description ?? "This action cannot be undone.",
          confirmLabel: options.confirmLabel ?? "Confirm",
          cancelLabel: options.cancelLabel ?? "Cancel",
          variant: options.variant ?? "default",
        })
      })
    },
    []
  )

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState((s) => ({ ...s, isOpen: false, resolve: null }))
  }, [state])

  const handleCancel = useCallback(() => {
    state.resolve?.(false)
    setState((s) => ({ ...s, isOpen: false, resolve: null }))
  }, [state])

  return {
    confirm,
    confirmState: state,
    handleConfirm,
    handleCancel,
  }
}
