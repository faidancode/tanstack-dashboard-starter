import type { AppPermission } from "../utils/permission.utils"


export interface AuthUser {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  role: UserRole
}

export interface UserRole {
  id: string
  name: string
  displayName: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  user: AuthUser
  tokens: AuthTokens
  permissions: (AppPermission | string)[]
}

import type { PermissionRule } from "../utils/permission.utils"
export type { PermissionRule, AppPermission }
