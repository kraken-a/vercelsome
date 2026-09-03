/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Structural source check — avoids importing next/server in jest.
const MIDDLEWARE = readFileSync(join(__dirname, '..', '..', 'middleware.ts'), 'utf8')
const LAYOUT = readFileSync(
  join(__dirname, '..', '..', 'app', '[locale]', 'layout.tsx'),
  'utf8',
)

describe('CSP nonce enforcement (TASK-031)', () => {
  it('generates a per-request nonce', () => {
    expect(MIDDLEWARE).toMatch(/crypto\.randomUUID\(\)/)
  })

  it('injects nonce into script-src', () => {
    expect(MIDDLEWARE).toMatch(/nonce-\$\{nonce\}/)
  })

  it('does not include unsafe-inline in script-src', () => {
    // Extract script-src template literal content
    const match = MIDDLEWARE.match(/script-src[^`"]+/)
    expect(match).not.toBeNull()
    // style-src legitimately uses unsafe-inline; assert only the script-src line is clean
    expect(match![0]).not.toContain("'unsafe-inline'")
  })

  it('does not include unsafe-eval anywhere in the CSP', () => {
    // The full buildCsp output must never contain unsafe-eval
    const buildCspFn = MIDDLEWARE.match(/function buildCsp[\s\S]+?\n\}/)
    expect(buildCspFn).not.toBeNull()
    expect(buildCspFn![0]).not.toContain("'unsafe-eval'")
  })

  it('uses strict-dynamic for trusted script propagation', () => {
    expect(MIDDLEWARE).toMatch(/'strict-dynamic'/)
  })

  it('propagates nonce via x-nonce request header', () => {
    expect(MIDDLEWARE).toMatch(/requestHeaders\.set\(["']x-nonce["']/)
  })

  it('applies the CSP header to every response branch', () => {
    // Count occurrences of response.headers.set(cspHeaderName, csp)
    const cspSets = (MIDDLEWARE.match(/response\.headers\.set\(cspHeaderName,\s*csp\)/g) ?? []).length
    expect(cspSets).toBeGreaterThanOrEqual(3) // redirect-valid, redirect-fail, normal
  })
})

describe('layout.tsx nonce consumption (TASK-031)', () => {
  it('reads x-nonce from request headers', () => {
    expect(LAYOUT).toMatch(/headers\(\).*get\(['"]x-nonce['"]\)|get\(['"]x-nonce['"]\)/)
  })

  it('passes nonce to every Script element', () => {
    const scriptTags = LAYOUT.match(/<Script\b[^>]*>/g) ?? []
    expect(scriptTags.length).toBeGreaterThan(0)
    for (const tag of scriptTags) {
      expect(tag).toMatch(/nonce=\{nonce\}/)
    }
  })
})
