/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

const revalidateTag = jest.fn()
const revalidatePath = jest.fn()
jest.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}))

import { POST } from '../route'

const SECRET = 'super-secret-value'

function buildRequest(body: unknown, secret?: string): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (secret !== undefined) headers['x-revalidate-secret'] = secret
  return new NextRequest('http://localhost/api/revalidate', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    revalidateTag.mockClear()
    revalidatePath.mockClear()
    process.env.REVALIDATE_SECRET = SECRET
  })

  it('revalidates a valid tag and path with the correct secret', async () => {
    const res = await POST(buildRequest({ tags: ['products'], paths: ['/fr/produits'] }, SECRET))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.revalidated).toBe(true)
    expect(json.tags).toContain('products')
    expect(json.paths).toContain('/fr/produits')
    expect(revalidateTag).toHaveBeenCalledWith('products')
    expect(revalidatePath).toHaveBeenCalledWith('/fr/produits')
  })

  it('drops a hostile traversal path (not revalidated)', async () => {
    const res = await POST(buildRequest({ paths: ['../../etc/passwd'] }, SECRET))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.paths).toEqual([])
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('drops an absolute URL path (not revalidated)', async () => {
    const res = await POST(buildRequest({ paths: ['http://evil.com/x'] }, SECRET))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.paths).toEqual([])
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('rejects a wrong-length secret via the timing-safe path (401)', async () => {
    const res = await POST(buildRequest({ tags: ['products'] }, 'short'))
    expect(res.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('rejects an equal-length but wrong secret (401)', async () => {
    const wrong = 'x'.repeat(SECRET.length)
    const res = await POST(buildRequest({ tags: ['products'] }, wrong))
    expect(res.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('rejects a missing secret (401)', async () => {
    const res = await POST(buildRequest({ tags: ['products'] }))
    expect(res.status).toBe(401)
  })
})
