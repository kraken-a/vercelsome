'use server'

import { cookies } from 'next/headers'
import { mintInviteToken } from '@/lib/auth-invite'

const TOKEN_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function redeemInviteCode(
  code: string,
): Promise<{ success: boolean; error?: string }> {
  const secret = process.env.INVITE_TOKEN_SECRET
  const rawCodes = process.env.INVITE_CODES ?? ''

  if (!secret) {
    console.error('[gate] INVITE_TOKEN_SECRET not set')
    return { success: false, error: 'server_error' }
  }

  const allowed = rawCodes
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)

  if (!allowed.includes(code.trim())) {
    return { success: false, error: 'invalid_code' }
  }

  const token = await mintInviteToken(secret)
  const cookieStore = await cookies()
  cookieStore.set('oaksome_invite_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  })

  return { success: true }
}
