/**
 * @jest-environment node
 *
 * TASK-047 — Ensure catalogue routes do not leak internal error details
 * (hostnames, IPs, ECONNREFUSED, URLs) in their error response bodies when
 * the upstream Odoo call fails. The full error must still be logged
 * server-side via console.error, but the client body must be generic.
 */
import { GET as spacesGET } from '../spaces/route'
import { GET as stylesGET } from '../styles/route'
import { GET as categoriesGET } from '../categories/route'
import { GET as productGET } from '../product/route'

// Mock the API client so apiGet throws an error carrying internal details.
jest.mock('@/lib/api/client', () => ({
  apiGet: jest.fn(),
}))

import { apiGet } from '@/lib/api/client'

const LEAKY_MESSAGE =
  'connect ECONNREFUSED 10.20.30.40:8069 (http://odoo.internal.local/api/oaksome/v1/navigation)'

const FORBIDDEN_FRAGMENTS = [
  'ECONNREFUSED',
  '10.20.30.40',
  '8069',
  'odoo.internal.local',
  'http://',
  '/api/oaksome',
]

function buildRequest(path: string): Request {
  return new Request(`http://localhost${path}`)
}

describe('TASK-047 — catalogue routes do not leak internal error details', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    ;(apiGet as jest.Mock).mockReset()
    ;(apiGet as jest.Mock).mockRejectedValue(new Error(LEAKY_MESSAGE))
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  const cases: Array<{
    name: string
    handler: (req: Request) => Promise<Response>
    path: string
    status: number
  }> = [
    { name: 'spaces', handler: spacesGET, path: '/api/odoo/spaces', status: 503 },
    { name: 'styles', handler: stylesGET, path: '/api/odoo/styles', status: 503 },
    { name: 'categories', handler: categoriesGET, path: '/api/odoo/categories', status: 503 },
    { name: 'product', handler: productGET, path: '/api/odoo/product', status: 500 },
  ]

  it.each(cases)(
    '$name route returns a generic body with the expected status and no leaked internals',
    async ({ handler, path, status }) => {
      const res = await handler(buildRequest(path))
      expect(res.status).toBe(status)

      const body = await res.json()
      expect(body).toEqual({ error: 'Service temporarily unavailable' })

      const serialized = JSON.stringify(body)
      for (const fragment of FORBIDDEN_FRAGMENTS) {
        expect(serialized).not.toContain(fragment)
      }
    },
  )

  it.each(cases)(
    '$name route still logs the full error server-side',
    async ({ handler, path }) => {
      await handler(buildRequest(path))
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logged = consoleErrorSpy.mock.calls.flat().map(String).join(' ')
      expect(logged).toContain('ECONNREFUSED')
    },
  )
})
