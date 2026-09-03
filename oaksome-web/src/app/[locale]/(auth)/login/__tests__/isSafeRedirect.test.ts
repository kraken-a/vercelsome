import { isSafeRedirect } from '@/lib/safe-redirect'

describe('isSafeRedirect', () => {
  it('accepts a bare slash', () => {
    expect(isSafeRedirect('/')).toBe(true)
  })

  it('accepts a valid locale-prefixed path', () => {
    expect(isSafeRedirect('/fr/profile')).toBe(true)
  })

  it('accepts a deep relative path', () => {
    expect(isSafeRedirect('/nl/commandes/42')).toBe(true)
  })

  it('rejects an absolute https URL', () => {
    expect(isSafeRedirect('https://evil.com')).toBe(false)
  })

  it('rejects a protocol-relative URL starting with //', () => {
    expect(isSafeRedirect('//evil.com')).toBe(false)
  })

  it('rejects a javascript: URI', () => {
    expect(isSafeRedirect('javascript:alert(1)')).toBe(false)
  })

  it('rejects a data: URI', () => {
    expect(isSafeRedirect('data:text/html,<script>evil</script>')).toBe(false)
  })

  it('rejects a Windows UNC-style path with backslash', () => {
    expect(isSafeRedirect('\\\\evil.com')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isSafeRedirect('')).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isSafeRedirect(undefined)).toBe(false)
  })

  it('rejects null', () => {
    expect(isSafeRedirect(null)).toBe(false)
  })

  it('rejects a path containing a colon (edge case)', () => {
    expect(isSafeRedirect('/path:with:colons')).toBe(false)
  })
})
