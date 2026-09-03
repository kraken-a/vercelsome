export type OakomeStatus =
  | 'cgv_pending'
  | 'deposit_pending'
  | 'measures_pending'
  | 'measures_scheduled'
  | 'plan_validated'
  | 'manufacturing'
  | 'ready'
  | 'delivering'
  | 'done'
  | ''

export type Order = {
  readonly id: number
  readonly name: string
  readonly date: string | null
  readonly oaksome_status: OakomeStatus
  readonly oaksome_so_type: 'so1' | 'so2'
  readonly amount_total: number
  readonly currency: string
  readonly state: string
  readonly product_summary: string
}

export type OrderLine = {
  readonly id: number
  readonly name: string
  readonly product_id: number
  readonly product_name: string
  readonly qty_ordered: number
  readonly price_unit: number
  readonly price_subtotal: number
  readonly price_total: number
}

export type OrderDetail = {
  readonly id: number
  readonly name: string
  readonly date: string | null
  readonly oaksome_status: OakomeStatus
  readonly oaksome_so_type: 'so1' | 'so2'
  readonly amount_untaxed: number
  readonly amount_tax: number
  readonly amount_total: number
  readonly currency: string
  readonly state: string
  readonly lines: ReadonlyArray<OrderLine>
  readonly cgv_signed: boolean
  readonly so2_id: number | null
}

export type Project = {
  readonly id: number
  readonly so1_id: number
  readonly name: string
  readonly date: string | null
  readonly status: OakomeStatus | ''
  readonly so2_status: OakomeStatus | null
  readonly state: string
  readonly amount_total: number
  readonly currency: string
  readonly so2_id: number | null
  readonly so2_name: string | null
  readonly product_count: number
  readonly product_summary: string
  readonly product_image_id: number | null
  readonly installation_scheduled: boolean
}

export type ProjectLine = {
  readonly id: number
  readonly description: string
  readonly qty: number
  readonly price_unit: number
  readonly price_subtotal: number
  readonly configuration_json: Record<string, unknown> | null
}

export type ProjectProduct = {
  readonly product_id: number
  readonly product_tmpl_id: number
  readonly product_name: string
  readonly product_image_id: number | null
  readonly so1: ProjectLine | null
  readonly so2: ProjectLine | null
  readonly delta: number | null
}

export type PaymentScheduleItem = {
  readonly amount: number
  readonly date: string | null
  readonly paid: boolean
}

export type ProjectDetail = {
  readonly id: number
  readonly so1_id: number
  readonly name: string
  readonly date: string | null
  readonly status: OakomeStatus | ''
  readonly so2_status: OakomeStatus | null
  readonly state: string
  readonly amount_total: number
  readonly amount_untaxed: number
  readonly amount_tax: number
  readonly currency: string
  readonly cgv_signed: boolean
  readonly so2: {
    readonly id: number
    readonly name: string
    readonly date: string | null
    readonly amount_total: number
    readonly amount_untaxed: number
    readonly amount_tax: number
  } | null
  readonly payment_schedule: {
    readonly project_total: number
    readonly tva_amount: number
    readonly so1_deposit: PaymentScheduleItem | null
    readonly so2_deposit: PaymentScheduleItem | null
    readonly balance: number | null
    readonly balance_paid: boolean
    readonly balance_date: string | null
    readonly deductions: ReadonlyArray<{
      readonly type: string
      readonly name: string
      readonly amount: number
    }>
  } | null
  readonly products: ReadonlyArray<ProjectProduct>
}
