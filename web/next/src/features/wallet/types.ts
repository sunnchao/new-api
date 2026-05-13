export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  url?: string;
}

export interface PaymentMethod {
  name: string;
  type: string;
  color?: string;
  min_topup?: number;
  icon?: string;
}

export interface WaffoPayMethod {
  name: string;
  icon?: string;
  payMethodType?: string;
  payMethodName?: string;
}

export interface CreemProduct {
  name: string;
  productId: string;
  price: number;
  quota: number;
  currency: "USD" | "EUR";
}

export interface TopupInfo {
  enable_online_topup: boolean;
  enable_stripe_topup: boolean;
  pay_methods: PaymentMethod[];
  min_topup: number;
  stripe_min_topup: number;
  amount_options: number[];
  discount: Record<number, number>;
  topup_link?: string;
  enable_creem_topup?: boolean;
  creem_products?: CreemProduct[];
  enable_waffo_topup?: boolean;
  waffo_pay_methods?: WaffoPayMethod[];
  waffo_min_topup?: number;
  enable_waffo_pancake_topup?: boolean;
  waffo_pancake_min_topup?: number;
}

export interface PresetAmount {
  value: number;
  discount?: number;
}

export interface RedemptionRequest {
  key: string;
}

export interface PaymentRequest {
  amount: number;
  payment_method: string;
}

export interface AmountRequest {
  amount: number;
}

export interface AffiliateTransferRequest {
  quota: number;
}

export type TopupStatus = "success" | "pending" | "expired";

export interface TopupRecord {
  id: number;
  user_id: number;
  amount: number;
  money: number;
  trade_no: string;
  payment_method: string;
  create_time: number;
  complete_time?: number;
  status: TopupStatus;
}

export interface BillingHistoryResponse {
  items: TopupRecord[];
  total: number;
}

export type PaymentPayload = Record<string, unknown>;
