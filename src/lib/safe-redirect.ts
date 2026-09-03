/**
 * Validates that a redirect target is a safe same-origin relative path.
 *
 * Rules:
 *  - Must be a non-empty string
 *  - Must start with "/" (relative path, never absolute URL)
 *  - Must NOT start with "//" (protocol-relative URL → external host)
 *  - Must NOT contain ":" (blocks javascript:, data:, https:, etc.)
 *  - Must NOT contain "\" (blocks \\evil.com Windows UNC paths)
 */
export function isSafeRedirect(url: unknown): url is string {
  if (typeof url !== 'string' || url.length === 0) return false
  return (
    url.startsWith('/') &&
    !url.startsWith('//') &&
    !url.includes(':') &&
    !url.includes('\\')
  )
}
