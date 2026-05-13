/**
 * Type-safe environment variable access.
 * Never use `import.meta.env` directly in application code — always import from here.
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  production: import.meta.env.PROD,
  development: import.meta.env.DEV,
} as const

// Validate required variables at startup
if (!env.apiUrl) {
  throw new Error(
    '[env] VITE_API_URL is not defined. ' +
    'Create a .env.development file with VITE_API_URL=http://localhost:5026/api/v1'
  )
}