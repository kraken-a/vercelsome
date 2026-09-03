/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const HEADER_CSS = readFileSync(join(__dirname, '..', 'header.css'), 'utf8')
const STYLE_CSS = readFileSync(
  join(__dirname, '..', '..', '..', 'css', 'style.css'),
  'utf8',
)

/**
 * Strips C-style block comments so we only inspect real CSS rules.
 * `header.css` keeps an explanatory comment referencing `.promo-bar-v2` —
 * we don't want that prose to mask the absence of a real rule.
 */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

describe('Promo bar — no duplicate `.promo-bar-v2` rules (TASK-022)', () => {
  const HEADER_RULES = stripCssComments(HEADER_CSS)

  it('header.css does NOT define a `.promo-bar-v2` selector', () => {
    // selector form: optional comma chain, then `{`
    expect(HEADER_RULES).not.toMatch(/\.promo-bar-v2\b[^{}\n]*\{/)
  })

  it('header.css does NOT define `.promo-bar-v2 a` (descendant rule)', () => {
    expect(HEADER_RULES).not.toMatch(/\.promo-bar-v2\s+a\b[^{}\n]*\{/)
  })

  it('canonical promo styles remain in src/css/style.css', () => {
    // `.promo-bar-v2 { ... overflow: hidden ... }`
    expect(STYLE_CSS).toMatch(/\.promo-bar-v2\s*\{/)
    expect(STYLE_CSS).toMatch(/overflow:\s*hidden/)
    // `.promo-marquee { ... animation: promo-scroll ... }`
    expect(STYLE_CSS).toMatch(/\.promo-marquee\s*\{/)
    expect(STYLE_CSS).toMatch(/animation:\s*promo-scroll/)
  })
})
