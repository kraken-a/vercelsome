#!/usr/bin/env node
// CI / pre-commit guard for messages/{fr,nl,en}.json parity.
// Mirrors the algorithm in src/lib/i18n/parity.ts. Exits 1 on mismatch.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MESSAGES_DIR = path.resolve(__dirname, '..', 'messages')
const LOCALES = ['fr', 'nl', 'en']

function collectKeyPaths(obj, prefix = '') {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return prefix ? [prefix] : []
  }
  const out = []
  for (const key of Object.keys(obj).sort()) {
    const value = obj[key]
    const next = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...collectKeyPaths(value, next))
    } else {
      out.push(next)
    }
  }
  return out
}

function loadLocale(locale) {
  const file = path.join(MESSAGES_DIR, `${locale}.json`)
  if (!fs.existsSync(file)) {
    console.error(`[i18n-check] missing ${file}`)
    process.exit(1)
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    console.error(`[i18n-check] invalid JSON in ${file}: ${err.message}`)
    process.exit(1)
  }
}

const keys = Object.fromEntries(LOCALES.map(l => [l, collectKeyPaths(loadLocale(l))]))
const reference = keys[LOCALES[0]]

let failed = false
for (const locale of LOCALES.slice(1)) {
  const missing = reference.filter(k => !keys[locale].includes(k))
  const extra = keys[locale].filter(k => !reference.includes(k))
  if (missing.length || extra.length) {
    failed = true
    console.error(`[i18n-check] ${locale}.json parity mismatch against ${LOCALES[0]}.json:`)
    if (missing.length) {
      console.error(`  missing in ${locale}.json (${missing.length}):`)
      for (const k of missing) console.error(`    - ${k}`)
    }
    if (extra.length) {
      console.error(`  extra in ${locale}.json (${extra.length}):`)
      for (const k of extra) console.error(`    + ${k}`)
    }
  }
}

if (failed) process.exit(1)
console.log(`[i18n-check] parity OK across [${LOCALES.join(', ')}] — ${reference.length} keys`)
