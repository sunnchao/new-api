export interface SubscriptionPlan {
  id: number;
  title: string;
  subtitle?: string;
  price_amount: number;
  currency?: string;
  duration_unit: "year" | "month" | "day" | "hour" | "custom";
  duration_value: number;
  custom_seconds?: number;
  quota_reset_period: "never" | "daily" | "weekly" | "monthly" | "custom";
  quota_reset_mode?: "anchor" | "natural";
  quota_reset_custom_seconds?: number;
  enabled: boolean;
  show_on_home?: boolean;
  sort_order: number;
  max_purchase_per_user: number;
  total_amount: number;
  upgrade_group?: string;
  allowed_groups?: string;
  billing_mode?: "quota" | "request";
  stripe_price_id?: string;
  creem_product_id?: string;
  hourly_limit_amount?: number;
  hourly_limit_hours?: number;
  hourly_reset_mode?: "anchor" | "natural";
  daily_limit_amount?: number;
  daily_reset_mode?: "anchor" | "natural";
  weekly_limit_amount?: number;
  weekly_reset_mode?: "anchor" | "natural";
  monthly_limit_amount?: number;
  monthly_reset_mode?: "anchor" | "natural";
  approximate_times?: number;
  hourly_approximate_times?: number;
  daily_approximate_times?: number;
  weekly_approximate_times?: number;
  monthly_approximate_times?: number;
}

export interface PlanRecord {
  plan: SubscriptionPlan;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: string;
  source?: string;
  billing_mode?: string;
  start_time: number;
  end_time: number;
  amount_total: number;
  amount_used: number;
  last_reset_time?: number;
  next_reset_time?: number;
  upgrade_group?: string;
  allowed_groups?: string;
  approximate_times?: number;
  hourly_limit_amount?: number;
  hourly_amount_used?: number;
  hourly_next_reset_time?: number;
  daily_limit_amount?: number;
  daily_amount_used?: number;
  daily_next_reset_time?: number;
  weekly_limit_amount?: number;
  weekly_amount_used?: number;
  weekly_next_reset_time?: number;
  monthly_limit_amount?: number;
  monthly_amount_used?: number;
  monthly_next_reset_time?: number;
}

export interface UserSubscriptionRecord {
  subscription: UserSubscription;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  url?: string;
}

export interface PlanPayload {
  plan: Partial<SubscriptionPlan>;
}

export interface SubscriptionPayRequest {
  plan_id: number;
  payment_method?: string;
}

export interface SubscriptionPayResponse {
  success: boolean;
  message?: string;
  data?: { pay_link?: string; checkout_url?: string; order_id?: string };
  url?: string;
}

export interface SelfSubscriptionData {
  billing_preference: string;
  subscriptions: UserSubscriptionRecord[];
  all_subscriptions: UserSubscriptionRecord[];
}

export interface AdminUserSubscriptionOverview {
  id: number;
  user_id: number;
  username: string;
  user_display_name: string;
  user_email: string;
  user_group: string;
  plan_id: number;
  plan_title: string;
  status: string;
  billing_mode: string;
  start_time: number;
  end_time: number;
  amount_total: number;
  amount_used: number;
  amount_remaining: number;
  approximate_times: number;
  upgrade_group: string;
  allowed_groups: string;
}

export interface AdminAllSubscriptionsResponse {
  data: AdminUserSubscriptionOverview[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminAllSubscriptionsParams {
  page?: number;
  page_size?: number;
  username?: string;
  plan_id?: number;
  status?: string;
}

export interface CreateUserSubscriptionRequest {
  plan_id: number;
}
