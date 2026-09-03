import { apiGet } from './client';
import type { Result } from './client';
import type { Order, OrderDetail, Project, ProjectDetail } from '@/types/order';

export async function getOrders(): Promise<Result<ReadonlyArray<Order>>> {
  return apiGet<ReadonlyArray<Order>>('/orders');
}

export async function getOrder(id: number): Promise<Result<OrderDetail>> {
  return apiGet<OrderDetail>(`/orders/${id}`);
}

export async function getProjects(): Promise<Result<{ projects: ReadonlyArray<Project> }>> {
  return apiGet<{ projects: ReadonlyArray<Project> }>('/projects');
}

export async function getProjectDetail(id: number): Promise<Result<ProjectDetail>> {
  return apiGet<ProjectDetail>(`/projects/${id}`);
}

export type SoLineConfig = {
  readonly configuration_json: Record<string, unknown> | null
  readonly product_tmpl_id: number
  readonly product_name: string
}

export async function getSoLineConfig(so1Id: number, lineId: number): Promise<Result<SoLineConfig>> {
  return apiGet<SoLineConfig>(`/projects/${so1Id}/lines/${lineId}/config`);
}

export type So1Line = {
  readonly id: number
  readonly name: string
  readonly qty: number
  readonly price_unit: number
  readonly subtotal: number
  readonly is_section?: boolean
  readonly is_downpayment?: boolean
}

export type So1Info = {
  readonly id: number
  readonly name: string
  readonly partner_name: string
  readonly so2_id: number | null
  readonly so2_name: string | null
  readonly tva6: boolean
  readonly lines: ReadonlyArray<So1Line>
  readonly amount_untaxed: number
  readonly amount_tax: number
  readonly amount_total: number
  readonly amount_deposited?: number
}

export async function getSo1Info(so1Id: number): Promise<Result<So1Info>> {
  return apiGet<So1Info>(`/projects/${so1Id}/info`);
}
