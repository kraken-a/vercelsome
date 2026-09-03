/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PAGE = readFileSync(join(__dirname, '..', 'page.tsx'), 'utf8')

describe('gamme/[slug] rendering mode (TASK-030)', () => {
  it('exports dynamic = force-dynamic to prevent DYNAMIC_SERVER_USAGE', () => {
    expect(PAGE).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/)
  })

  it('does not export revalidate (was causing DYNAMIC_SERVER_USAGE error in prod builds)', () => {
    expect(PAGE).not.toMatch(/export\s+const\s+revalidate/)
  })
})
