import { NextResponse } from 'next/server'
import dns from 'node:dns/promises'

export async function GET() {
  const odooUrl = process.env.ODOO_URL || 'NOT SET'
  const hostname = 'odoo.oaksome.com'
  const target = `${odooUrl}/web/health`

  let dnsResult: string
  try {
    const addrs = await dns.lookup(hostname)
    dnsResult = JSON.stringify(addrs)
  } catch (err) {
    dnsResult = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  }

  let fetchResult: string
  let causeMsg = ''
  try {
    const r = await fetch(target, { signal: AbortSignal.timeout(8000) })
    fetchResult = `HTTP ${r.status}`
  } catch (err) {
    fetchResult = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    if (err instanceof Error && (err as NodeJS.ErrnoException).cause) {
      const cause = (err as NodeJS.ErrnoException).cause as Error
      causeMsg = `${cause.name}: ${cause.message}`
    }
  }

  return NextResponse.json({ odooUrl, hostname, dnsResult, target, fetchResult, causeMsg })
}
