import { apiGet, apiPost } from './client';
import type { Result } from './client';

export type SlotsResponse = {
  readonly available_days: ReadonlyArray<string>
  readonly slots_by_day: Record<string, string[]>
  readonly slot_type: string
  readonly month: string
}

export async function getSlots(type: string, month: string, teamId?: number): Promise<Result<SlotsResponse>> {
  return apiGet<SlotsResponse>('/appointments/slots', { type, month, ...(teamId ? { team_id: String(teamId) } : {}) })
}

export type ShowroomMobileTeam = { readonly id: number; readonly name: string }

export async function getShowroomMobileTeams(): Promise<Result<{ teams: ShowroomMobileTeam[] }>> {
  return apiGet('/showroom-mobile/teams')
}

export type Appointment = {
  readonly id: number
  readonly name: string
  readonly start: string | null
  readonly end: string | null
  readonly past: boolean
  readonly description: string
  readonly slot_type: string
  readonly order_id: number | null
  readonly order_name: string | null
}

export async function getAppointments(): Promise<Result<ReadonlyArray<Appointment>>> {
  const result = await apiGet<{ appointments: Appointment[] }>('/appointments')
  if (!result.success) return result
  return { success: true, data: result.data.appointments ?? [] }
}

export type BookAppointmentRequest = {
  readonly type: string
  readonly date_start: string   // ISO 8601
  readonly date_end: string     // ISO 8601
  readonly order_id?: number | null
  readonly appointment_id?: number | null
  readonly notes?: string
}

export type BookAppointmentResponse = {
  readonly appointment_id: number
  readonly date: string
  readonly message: string
}

export async function bookAppointment(
  data: BookAppointmentRequest
): Promise<Result<BookAppointmentResponse>> {
  return apiPost<BookAppointmentResponse>('/appointments/book', data)
}

export type OrderAppointment = {
  readonly task_id: number
  readonly start: string
  readonly end: string
  readonly technician: string
}

export async function cancelAppointment(appointmentId: number): Promise<Result<{ cancelled: boolean }>> {
  return apiPost<{ cancelled: boolean }>('/appointments/cancel', { appointment_id: appointmentId })
}

export type BookMobilePublicRequest = {
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly address?: string
  readonly date_start: string
  readonly date_end: string
  readonly notes?: string
}

export async function bookMobilePublic(
  data: BookMobilePublicRequest
): Promise<Result<BookAppointmentResponse>> {
  return apiPost<BookAppointmentResponse>('/appointments/mobile-book', data)
}

export async function getOrderAppointment(
  orderId: number,
  slotType: string,
): Promise<Result<OrderAppointment | null>> {
  const r = await apiGet<{ appointment: OrderAppointment | null }>(
    '/appointments/order',
    { order_id: String(orderId), slot_type: slotType },
  )
  if (!r.success) return r
  return { success: true, data: r.data.appointment }
}
