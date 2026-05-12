export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  url?: string;
}

export type PlanPayload = Record<string, unknown>;
export type SubscriptionPayRequest = Record<string, unknown>;
export type AdminAllSubscriptionsParams = Record<string, unknown>;
