/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PAGE_PATH = join(__dirname, '..', '_client.tsx')
const SRC = readFileSync(PAGE_PATH, 'utf8')

describe('Echantillons page reassurance image paths (TASK-017)', () => {
  it('uses absolute paths for reassurance-samples.png', () => {
    expect(SRC).not.toMatch(/src=["']images\/reassurance-samples\.png["']/)
    expect(SRC).toMatch(/src=["']\/images\/reassurance-samples\.png["']/)
  })

  it('uses absolute paths for reassurance-agenda.png', () => {
    expect(SRC).not.toMatch(/src=["']images\/reassurance-agenda\.png["']/)
    expect(SRC).toMatch(/src=["']\/images\/reassurance-agenda\.png["']/)
  })
})
