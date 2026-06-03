/**
 * @jest-environment node
 */
import { hashSha256Lower } from '../capi-hash'

describe('hashSha256Lower', () => {
  it('hashes a normalized email to its known SHA-256', async () => {
    // sha256("user@example.com") = b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514
    const out = await hashSha256Lower('user@example.com')
    expect(out).toBe(
      'b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514',
    )
  })

  it('normalizes whitespace and case before hashing', async () => {
    const a = await hashSha256Lower('  User@Example.COM  ')
    const b = await hashSha256Lower('user@example.com')
    expect(a).toBe(b)
  })

  it('returns a 64-char lowercase hex string', async () => {
    const out = await hashSha256Lower('anything')
    expect(out).toMatch(/^[a-f0-9]{64}$/)
  })

  it('throws on empty / whitespace-only input', async () => {
    await expect(hashSha256Lower('')).rejects.toThrow()
    await expect(hashSha256Lower('   ')).rejects.toThrow()
  })
})
