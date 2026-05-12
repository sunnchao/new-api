export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export type InvoicePayload = Record<string, unknown>;
export type InvoiceParams = Record<string, unknown>;
