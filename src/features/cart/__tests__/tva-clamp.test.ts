/** @jest-environment jsdom */

import { readTvaRate, VALID_TVA_RATES, DEFAULT_TVA } from '../context'

describe('readTvaRate — clamps tampered localStorage values (L4)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keeps a valid stored rate (0.06)', () => {
    localStorage.setItem('oaksome-tva-rate', JSON.stringify(0.06))
    expect(readTvaRate()).toBe(0.06)
  })

  it('keeps a valid stored rate (0.21)', () => {
    localStorage.setItem('oaksome-tva-rate', JSON.stringify(0.21))
    expect(readTvaRate()).toBe(0.21)
  })

  it('falls back to default for an out-of-set numeric value (0.001)', () => {
    localStorage.setItem('oaksome-tva-rate', JSON.stringify(0.001))
    expect(readTvaRate()).toBe(DEFAULT_TVA)
  })

  it('falls back to default for a negative value (-1)', () => {
    localStorage.setItem('oaksome-tva-rate', JSON.stringify(-1))
    expect(readTvaRate()).toBe(DEFAULT_TVA)
  })

  it('falls back to default for a non-numeric value ("abc")', () => {
    localStorage.setItem('oaksome-tva-rate', JSON.stringify('abc'))
    expect(readTvaRate()).toBe(DEFAULT_TVA)
  })

  it('falls back to default when nothing is stored', () => {
    expect(readTvaRate()).toBe(DEFAULT_TVA)
  })

  it('falls back to default for malformed JSON in storage', () => {
    localStorage.setItem('oaksome-tva-rate', '{not json')
    expect(readTvaRate()).toBe(DEFAULT_TVA)
  })

  it('exposes exactly the canonical Belgian rate set', () => {
    expect([...VALID_TVA_RATES]).toEqual([0.06, 0.21])
  })
})
