/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Source: structural checks (i18n calls, routes)
const PAGE = readFileSync(join(__dirname, '..', 'page.tsx'), 'utf8')

// Content: page uses next-intl so the actual French strings live in the message catalogue
const FR_MESSAGES_PATH = join(__dirname, '..', '..', '..', '..', '..', '..', 'messages', 'fr.json')
const FR = JSON.parse(readFileSync(FR_MESSAGES_PATH, 'utf8')) as Record<string, unknown>
const A11Y = (FR.legal as Record<string, unknown>)?.accessibilite_page as Record<string, string> ?? {}

describe('Accessibilité page content (TASK-020)', () => {
  it('uses the accented heading "Accessibilité" (in FR translations)', () => {
    // Page renders <h1>{t('breadcrumb')}</h1>; content is in the catalogue
    expect(A11Y.breadcrumb).toMatch(/Accessibilit[ée]/i)
    expect(A11Y.breadcrumb).not.toMatch(/Accessibilite$/)
  })

  it('declares WCAG 2.1 AA as the conformance target (in FR translations)', () => {
    const combined = Object.values(A11Y).join(' ')
    expect(combined).toMatch(/WCAG\s*2\.1[^A-Z]*AA/i)
  })

  it('describes the scope of compliance (in FR translations)', () => {
    const combined = Object.values(A11Y).join(' ')
    expect(combined).toMatch(/Périmètre|Portée|Scope/i)
  })

  it('declares known limitations (in FR translations)', () => {
    const combined = Object.values(A11Y).join(' ')
    expect(combined).toMatch(/Limitations?[\s\S]{0,40}(connues?)?/i)
  })

  it('links to the contact route for reporting accessibility issues', () => {
    expect(PAGE).toMatch(/\/contact/)
  })

  it('includes a last-assessed date (in FR translations)', () => {
    const combined = Object.values(A11Y).join(' ')
    expect(combined).toMatch(/Derni[èe]re|Dernier|évaluation/i)
  })

  it('is substantive (>= 2500 chars of source)', () => {
    expect(PAGE.length).toBeGreaterThanOrEqual(2500)
  })
})
