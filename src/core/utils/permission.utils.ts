/**
 * RBAC Permission Utilities
 * Single source of truth for all permission-related types and logic.
 */

export const ACTIONS = ["create", "read", "update", "delete", "manage"] as const
export type Action = (typeof ACTIONS)[number]

export const SUBJECTS = [
  "Employee",
  "Department",
  "Position",
  "User",
  "Role",
  "Dashboard",
  "all",
] as const
export type Subject = (typeof SUBJECTS)[number]

/** A strongly-typed permission string in the format "Subject:action". */
export type AppPermission = `${Subject}:${Action}`

export interface PermissionRule {
  action: string
  subject: string
}

/**
 * Parse a permission string.
 * Supports both "Subject:action" and "Subject.action" separators
 * for compatibility with various backend formats.
 */
export function parsePermission(permission: AppPermission | string): {
  action: string
  subject: string
} {
  // Support both colon and dot separators
  const separator = permission.includes(":") ? ":" : "."
  const [subject, action] = permission.split(separator)

  if (!subject || !action) {
    throw new Error(
      `Invalid permission format: "${permission}". Expected "Subject:action".`
    )
  }

  return { subject, action }
}

/**
 * Check whether a set of permission rules grants the requested action on the subject.
 *
 * Rules are matched in order. A rule with subject "all" or action "manage" acts as a wildcard.
 */
export function can(
  permissions: PermissionRule[],
  action: string,
  subject: string
): boolean {
  return permissions.some((rule) => {
    const subjectMatch = rule.subject === subject || rule.subject === "all"
    const actionMatch = rule.action === action || rule.action === "manage"
    return subjectMatch && actionMatch
  })
}

/** Build a PermissionRule array from an array of AppPermission strings. */
export function buildPermissions(
  permissions: (AppPermission | string)[]
): PermissionRule[] {
  return permissions.map(parsePermission)
}
