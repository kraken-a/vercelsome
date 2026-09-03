'use server'

import { cookies } from 'next/headers'
import { mintInviteToken } from '@/lib/auth-invite'

const TOKEN_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Grants a signed invite token to an already-authenticated user.
 * Called after successful login so the LandingGate middleware lets them through.
 */
export async function grantInviteToken(): Promise<void> {
  const secret = process.env.INVITE_TOKEN_SECRET
  if (!secret) {
    // Gate is not configured — no-op (dev / open-access mode)
    return
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
}
