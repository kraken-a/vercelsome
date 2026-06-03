import { NextResponse } from 'next/server'

export async function GET() {
  const odooUrl = process.env.ODOO_URL || 'NOT SET'
  const target = `${odooUrl}/web/health`
  let result: string
  try {
    const r = await fetch(target, { signal: AbortSignal.timeout(8000) })
    result = `HTTP ${r.status}`
  } catch (err) {
    result = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  }
  return NextResponse.json({ odooUrl, target, result })
}
