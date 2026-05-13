import { useState, useEffect } from "react"

/**
 * Debounces a value by the given delay in milliseconds.
 * The returned value only updates after the input has been stable for `delay` ms.
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 300)
 * // Use debouncedSearch as the query param — won't fire on every keystroke
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
