/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PAGE = readFileSync(join(__dirname, '..', 'page.tsx'), 'utf8')

describe('Accessibilité page content (TASK-020)', () => {
  it('uses the accented heading "Accessibilité"', () => {
    expect(PAGE).toMatch(/<h1[^>]*>Accessibilit[ée]<\/h1>|>Accessibilité</)
    expect(PAGE).not.toMatch(/>Accessibilite</)
  })

  it('declares WCAG 2.1 AA as the conformance target', () => {
    expect(PAGE).toMatch(/WCAG\s*2\.1[^A-Z]*AA/i)
  })

  it('describes the scope of compliance', () => {
    expect(PAGE).toMatch(/Périmètre|Portée|Scope/i)
  })

  it('declares known limitations', () => {
    expect(PAGE).toMatch(/Limitations?[\s\S]{0,40}(connues?)?/i)
  })

  it('links to the contact route for reporting accessibility issues', () => {
    expect(PAGE).toMatch(/\/contact/)
  })

  it('includes a last-assessed date', () => {
    expect(PAGE).toMatch(/Derni[èe]re|Dernier|évaluation/i)
  })

  it('is substantive (>= 2500 chars of source)', () => {
    expect(PAGE.length).toBeGreaterThanOrEqual(2500)
  })
})
