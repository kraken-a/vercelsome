/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PAGE = readFileSync(join(__dirname, '..', '_client.tsx'), 'utf8')

describe('Configurer canvas observability probe (TASK-016)', () => {
  it('schedules a 5s timer to check for the iframe canvas', () => {
    expect(PAGE).toMatch(/setTimeout\(/)
    expect(PAGE).toMatch(/\b5000\b|\b5\s*\*\s*1000\b/)
  })

  it('queries for a `<canvas>` inside the iframe contentDocument', () => {
    expect(PAGE).toMatch(/iframeRef\.current\?\.contentDocument[\s\S]{0,80}canvas/)
  })

  it('wraps the contentDocument read in a try/catch (cross-origin safe)', () => {
    expect(PAGE).toMatch(/try\s*\{[\s\S]{0,400}contentDocument[\s\S]{0,200}catch/)
  })

  it('warns via console.warn when canvas is missing after 5s', () => {
    expect(PAGE).toMatch(/console\.warn\(\s*['"`]\[configurer\][^'"]*no canvas/)
  })

  it('clears the timer on unmount', () => {
    expect(PAGE).toMatch(/clearTimeout\(/)
  })
})
