import fs from 'node:fs'
import path from 'node:path'

import { collectKeyPaths } from '../parity'

const ROOT = path.resolve(__dirname, '../../../../messages')

function loadJson(file: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'))
}

describe('messages/{fr,nl,en}.json parity', () => {
  it('every key path in fr.json exists in nl.json and en.json', () => {
    const fr = collectKeyPaths(loadJson('fr.json'))
    const nl = collectKeyPaths(loadJson('nl.json'))
    const en = collectKeyPaths(loadJson('en.json'))
    const missingInNl = fr.filter(k => !nl.includes(k))
    const missingInEn = fr.filter(k => !en.includes(k))
    expect(missingInNl).toEqual([])
    expect(missingInEn).toEqual([])
  })

  it('every key path in translated locales exists in fr.json', () => {
    const fr = collectKeyPaths(loadJson('fr.json'))
    const nl = collectKeyPaths(loadJson('nl.json'))
    const en = collectKeyPaths(loadJson('en.json'))
    const missingInFr = nl.filter(k => !fr.includes(k))
    const missingEnInFr = en.filter(k => !fr.includes(k))
    expect(missingInFr).toEqual([])
    expect(missingEnInFr).toEqual([])
  })
})

describe('collectKeyPaths', () => {
  it('returns dotted paths for nested objects in stable order', () => {
    const sample = { a: { b: 1, c: { d: 2 } }, e: 3 }
    expect(collectKeyPaths(sample)).toEqual(['a.b', 'a.c.d', 'e'])
  })

  it('treats arrays as leaf values', () => {
    const sample = { list: [1, 2, 3] }
    expect(collectKeyPaths(sample)).toEqual(['list'])
  })

  it('returns empty for {}', () => {
    expect(collectKeyPaths({})).toEqual([])
  })
})
