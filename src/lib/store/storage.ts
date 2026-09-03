/**
 * Generic localStorage helpers with JSON serialization.
 * All operations are immutable — they return new values, never mutate.
 */

export function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function removeItem(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}
