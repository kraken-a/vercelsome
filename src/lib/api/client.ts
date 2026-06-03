// Server-side: call Odoo directly via internal URL. Browser-side: go through Next.js proxy (avoids CORS).
const BASE_URL = typeof window === 'undefined'
  ? (process.env.ODOO_URL || process.env.NEXT_PUBLIC_ODOO_URL || '')
  : (typeof location !== 'undefined' ? location.origin : '')
const API_PREFIX = '/api/oaksome/v1'
const FETCH_TIMEOUT_MS = 15_000
export const CHECKOUT_TIMEOUT_MS = 60_000

export type PaginatedMeta = {
  readonly total: number
  readonly page: number
  readonly limit: number
}

export type Result<T> =
  | { readonly success: true; readonly data: T; readonly meta?: PaginatedMeta }
  | { readonly success: false; readonly error: string; readonly code: number }

type FetchOptions = {
  readonly revalidate?: number | false
  readonly timeout?: number
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${BASE_URL}${API_PREFIX}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  return url.toString()
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string>,
  options?: FetchOptions,
): Promise<Result<T>> {
  const timeoutMs = options?.timeout ?? FETCH_TIMEOUT_MS
  try {
    const url = buildUrl(path, params)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const fetchOptions: RequestInit = {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
    }

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body)
    }

    if (options?.revalidate !== undefined) {
      ;(fetchOptions as Record<string, unknown>).next = {
        revalidate: options.revalidate,
      }
    }

    const response = await fetch(url, fetchOptions)
    clearTimeout(timer)

    if (!response.ok) {
      const errorBody = await response.text()
      let errorMessage: string
      try {
        const parsed = JSON.parse(errorBody)
        const e = parsed.error
        errorMessage = (typeof e === 'string' ? e : e?.message) || parsed.message || response.statusText
      } catch {
        errorMessage = errorBody || response.statusText
      }
      return { success: false, error: errorMessage, code: response.status }
    }

    const json = await response.json()

    if (json.meta) {
      return { success: true, data: json.data ?? json, meta: json.meta }
    }

    return { success: true, data: json.data ?? json }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: `Odoo request timed out after ${timeoutMs}ms`, code: 504 }
    }
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return { success: false, error: message, code: 500 }
  }
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string>,
  options?: FetchOptions,
): Promise<Result<T>> {
  return request<T>('GET', path, undefined, params, options)
}

export async function apiPost<T>(path: string, body: unknown, options?: FetchOptions): Promise<Result<T>> {
  return request<T>('POST', path, body, undefined, options)
}

export async function apiPut<T>(path: string, body: unknown): Promise<Result<T>> {
  return request<T>('PUT', path, body)
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<Result<T>> {
  return request<T>('DELETE', path, body)
}
