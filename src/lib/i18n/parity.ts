// Pure helper for messages parity checks.
// Used by jest tests and by scripts/i18n-check.mjs (re-implemented inline there).

export function collectKeyPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return prefix ? [prefix] : []
  }
  const out: string[] = []
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    const value = (obj as Record<string, unknown>)[key]
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...collectKeyPaths(value, path))
    } else {
      out.push(path)
    }
  }
  return out
}
