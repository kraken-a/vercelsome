// The call site uses `isomorphic-dompurify`, which delegates to the browser
// `dompurify` build when a DOM (`window`) is present — the case in a real
// Next.js client component and in this jsdom test env. We import `dompurify`
// directly so Jest does not load isomorphic-dompurify's bundled-jsdom (ESM)
// server path, which Jest's default node_modules transform-ignore cannot parse.
import createDOMPurify from 'dompurify'

const DOMPurify = createDOMPurify(window)

/**
 * Guards the inline sanitizer applied at the etude-de-cas description sink
 * (src/app/[locale]/(shop)/etude-de-cas/[slug]/_client.tsx). Odoo CMS HTML is
 * untrusted; this asserts active content is stripped and formatting preserved.
 * Config must mirror the call site exactly.
 */
const sanitize = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href'],
  })

describe('CMS description sanitization (etude-de-cas sink)', () => {
  it('strips img with onerror handler', () => {
    const out = sanitize('<img src=x onerror=alert(1)>')
    expect(out).not.toMatch(/onerror/i)
    expect(out).not.toMatch(/<img/i)
    expect(out).not.toMatch(/alert\(1\)/)
  })

  it('strips javascript: href on anchors', () => {
    const out = sanitize('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toMatch(/javascript:/i)
    expect(out).not.toMatch(/alert\(1\)/)
    // anchor tag may remain but the dangerous href must be gone
    expect(out).toContain('x')
  })

  it('preserves allowed formatting tags', () => {
    const out = sanitize('<p><strong>ok</strong></p>')
    expect(out).toBe('<p><strong>ok</strong></p>')
  })

  it('strips svg/script payloads', () => {
    const out = sanitize('<svg><script>alert(1)</script></svg>')
    expect(out).not.toMatch(/<script/i)
    expect(out).not.toMatch(/<svg/i)
    expect(out).not.toMatch(/alert\(1\)/)
  })

  it('renders nothing for empty input without throwing', () => {
    expect(sanitize('')).toBe('')
  })
})
