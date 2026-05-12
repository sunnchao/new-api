export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  url?: string;
}

export type PaymentPayload = Record<string, unknown>;
export type BillingHistoryResponse = Record<string, unknown>;
