export type LeadRequest = {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly product_id?: number;
  readonly config_data?: Record<string, unknown>;
  readonly message?: string;
  readonly source?: string;
  readonly country_code?: string;
};

export type LeadResponse = {
  readonly id: number;
  readonly token: string;
  readonly message: string;
};

export type ShareResponse = {
  readonly token: string;
  readonly url: string;
  readonly expires_at: string;
};
