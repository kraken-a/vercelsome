/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const FOOTER_PATH = join(__dirname, '..', 'footer.tsx')
const ROUTING_PATH = join(__dirname, '..', '..', '..', 'i18n', 'routing.ts')
const FOOTER_SRC = readFileSync(FOOTER_PATH, 'utf8')
const ROUTING_SRC = readFileSync(ROUTING_PATH, 'utf8')

describe('Footer link routing matches production slugs', () => {
  it('includes the production-only Explorer materials entry', () => {
    expect(FOOTER_SRC).toMatch(/href=\s*"\/gamme"/)
    expect(FOOTER_SRC).toMatch(/t\('footer\.materials'\)/)
  })

  it('uses i18n navigation links so localized public slugs are emitted', () => {
    expect(FOOTER_SRC).toMatch(/import\s+\{\s*Link\s*}\s+from\s+'@\/i18n\/navigation'/)
    expect(FOOTER_SRC).not.toMatch(/import\s+Link\s+from\s+'next\/link'/)
  })

  it('maps footer legal links to the public production slugs', () => {
    expect(ROUTING_SRC).toMatch(/'\/gamme':[\s\S]*fr:\s*'\/materiaux'/)
    expect(ROUTING_SRC).toMatch(/'\/prise-mesures':[\s\S]*fr:\s*'\/prises-de-mesures'/)
    expect(ROUTING_SRC).toMatch(/'\/return':[\s\S]*fr:\s*'\/retours'/)
    expect(ROUTING_SRC).toMatch(/'\/cookies':[\s\S]*fr:\s*'\/pdc-cookies'/)
  })
})
