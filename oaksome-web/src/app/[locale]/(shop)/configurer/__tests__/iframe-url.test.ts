/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PAGE_PATH = join(__dirname, '..', '_client.tsx')
const SRC = readFileSync(PAGE_PATH, 'utf8')

describe('Configurer iframe URL (TASK-015)', () => {
  it('does not hardcode the /en/ locale', () => {
    expect(SRC).not.toMatch(/oaksome-client\.vercel\.app\/en\//)
  })

  it('does not emit a buggy `?=` empty query', () => {
    expect(SRC).not.toMatch(/\/article\?=/)
  })

  it('reads the active locale from route params', () => {
    expect(SRC).toMatch(/useParams|params\.locale|params: \{ locale/)
  })

  it('builds the iframe URL via an iframeLocale interpolation', () => {
    // Source maps nl→en via `iframeLocale`; the URL uses ${iframeLocale} not raw ${locale}
    expect(SRC).toMatch(/oaksome-client\.vercel\.app\/\$\{iframeLocale\}\/article/)
  })
})
