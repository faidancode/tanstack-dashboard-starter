// Jika error, coba import dari root src
// import { env } from "../../env"
// import { env } from "../../../env"
// import { env } from "../../../src/env"
// import { env } from "../../../../src/env"

import { env } from "@/env"

/** 
 * Logger utility — no-op in production, forwards to console.* in development.
 * Use this instead of console.log/warn/error directly in application code.
 */
export const logger = {
  log: (...args: unknown[]): void => {
    if (!env.production) {
      console.log("[LOG]", ...args)
    }
  },
  warn: (...args: unknown[]): void => {
    if (!env.production) {
      console.warn("[WARN]", ...args)
    }
  },
  // Errors are always logged regardless of environment
  error: (...args: unknown[]): void => {
    console.error("[ERROR]", ...args)
  },
  debug: (...args: unknown[]): void => {
    if (env.development) {
      console.debug("[DEBUG]", ...args)
    }
  },
}
