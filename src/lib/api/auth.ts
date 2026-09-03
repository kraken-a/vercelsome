import { apiPost } from './client'
import type { Result } from './client'

export type LoginData = {
  readonly login: string
  readonly password: string
}

export type LoginResponse = {
  readonly user_id: number
  readonly name: string
  readonly email: string
  readonly is_pro: boolean
  readonly session_id: string
}

export type RegisterData = {
  readonly name: string
  readonly email: string
  readonly password: string
  readonly phone?: string
  readonly is_pro?: boolean
  readonly company_name?: string | null
}

export type RegisterResponse = {
  readonly user_id: number
  readonly confirmation_sent: boolean
}

export async function login(data: LoginData): Promise<Result<LoginResponse>> {
  return apiPost<LoginResponse>('/auth/login', data)
}

export async function register(data: RegisterData): Promise<Result<RegisterResponse>> {
  return apiPost<RegisterResponse>('/auth/register', data)
}

export async function logout(): Promise<Result<{ message: string }>> {
  return apiPost<{ message: string }>('/auth/logout', {})
}

export async function recoverPassword(email: string): Promise<Result<{ message: string }>> {
  return apiPost<{ message: string }>('/auth/password-recover', { email })
}

export async function resetPassword(token: string, password: string): Promise<Result<{ message: string }>> {
  return apiPost<{ message: string }>('/auth/password-reset', { token, password })
}
