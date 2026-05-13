/**
 * General-purpose formatting utilities.
 */

/** Format a date string or Date object to a locale-aware display string. */
export function formatDate(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof value === "string" ? new Date(value) : value
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  })
}

/** Format a number as a currency string. */
export function formatCurrency(
  value: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    value
  )
}

/** Truncate a string to a max length, appending an ellipsis if truncated. */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 3)}...`
}

/** Convert a camelCase or snake_case key to a Title Case label. */
export function labelFromKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\s/, "")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Pluralize a word based on a count. */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) return `${count} ${singular}`
  return `${count} ${plural ?? `${singular}s`}`
}
