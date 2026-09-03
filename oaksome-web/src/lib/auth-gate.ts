/**
 * Public-path allowlist used by the edge middleware to decide whether an
 * incoming request can be served without an authenticated session.
 *
 * Patterns are compared against the URL path *after* the locale segment has
 * been stripped (e.g. `/fr/cgv` → `/cgv`). A request matches when the path
 * equals a pattern exactly or starts with `pattern + "/"`.
 *
 * Anything not on this list is treated as protected — unauthenticated
 * visitors are redirected to `/{locale}/landing`.
 */
export const PUBLIC_PATTERNS: readonly string[] = [
  '/landing',
  '/login',
  '/password-recover',
  '/password-reset',
  '/configurer',
  '/register',
]

/**
 * Returns `true` when `pathWithoutLocale` is on the public allowlist.
 *
 * The function is pure and Edge-runtime safe: it performs only string
 * comparisons and has no I/O, no Node APIs, and no mutable state.
 */
export function isPublicPath(pathWithoutLocale: string): boolean {
  if (typeof pathWithoutLocale !== 'string' || pathWithoutLocale.length === 0) {
    return false
  }
  if (pathWithoutLocale === '/') return false
  return PUBLIC_PATTERNS.some(
    (pattern) =>
      pathWithoutLocale === pattern ||
      pathWithoutLocale.startsWith(pattern + '/'),
  )
}
