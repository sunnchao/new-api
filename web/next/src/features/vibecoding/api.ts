import { api } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface VibeCodingSubscription {
  id: number;
  user_id: number;
  username: string;
  plan_id?: number;
  plan_type: string;
  status: "active" | "expired" | "cancelled" | string;
  start_time: number;
  end_time: number;
}

export interface VibeCodingPlan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  features?: string[];
  recommended?: boolean;
}

export interface GrantSubscriptionData {
  user_id: number;
  plan_id: number;
}

type BackendSubscriptionOverview = {
  id: number;
  user_id: number;
  username?: string;
  user_display_name?: string;
  user_email?: string;
  plan_id?: number;
  plan_title?: string;
  status: string;
  start_time: number;
  end_time: number;
};

type BackendSubscriptionOverviewResponse = {
  data?: BackendSubscriptionOverview[];
  total?: number;
  page?: number;
  page_size?: number;
};

type BackendPlanRecord = {
  plan?: {
    id: number;
    title?: string;
    subtitle?: string;
    price_amount?: number;
    duration_unit?: string;
    duration_value?: number;
    enabled?: boolean;
    sort_order?: number;
  };
};

type BackendSelfSubscription = {
  subscription?: {
    id: number;
    user_id: number;
    plan_id?: number;
    status: string;
    start_time: number;
    end_time: number;
  };
  plan?: {
    id?: number;
    title?: string;
  };
};

type BackendSelfSubscriptionResponse = {
  subscriptions?: BackendSelfSubscription[];
  all_subscriptions?: BackendSelfSubscription[];
};

function mapOverviewSubscription(
  item: BackendSubscriptionOverview
): VibeCodingSubscription {
  return {
    id: item.id,
    user_id: item.user_id,
    username:
      item.username ||
      item.user_display_name ||
      item.user_email ||
      `#${item.user_id}`,
    plan_id: item.plan_id,
    plan_type: item.plan_title || (item.plan_id ? `Plan #${item.plan_id}` : "-"),
    status: item.status,
    start_time: item.start_time,
    end_time: item.end_time,
  };
}

function mapSelfSubscription(
  item: BackendSelfSubscription
): VibeCodingSubscription | null {
  if (!item.subscription) return null;

  return {
    id: item.subscription.id,
    user_id: item.subscription.user_id,
    username: "",
    plan_id: item.subscription.plan_id ?? item.plan?.id,
    plan_type:
      item.plan?.title ||
      (item.subscription.plan_id ? `Plan #${item.subscription.plan_id}` : "-"),
    status: item.subscription.status,
    start_time: item.subscription.start_time,
    end_time: item.subscription.end_time,
  };
}

function durationToDays(unit?: string, value?: number): number {
  const normalizedValue = value && value > 0 ? value : 1;
  switch (unit) {
    case "year":
      return normalizedValue * 365;
    case "month":
      return normalizedValue * 30;
    case "hour":
      return Math.max(1, Math.ceil(normalizedValue / 24));
    case "custom":
      return normalizedValue;
    case "day":
    default:
      return normalizedValue;
  }
}

function mapPlan(item: BackendPlanRecord): VibeCodingPlan | null {
  if (!item.plan) return null;

  return {
    id: item.plan.id,
    name: item.plan.title || `Plan #${item.plan.id}`,
    price: item.plan.price_amount ?? 0,
    duration_days: durationToDays(
      item.plan.duration_unit,
      item.plan.duration_value
    ),
    features: item.plan.subtitle ? [item.plan.subtitle] : undefined,
    recommended: Boolean(item.plan.sort_order && item.plan.sort_order > 0),
  };
}

// ============================================================================
// Admin APIs
// ============================================================================

export async function getClaudeCodeAdminSubscriptions(): Promise<
  ApiResponse<VibeCodingSubscription[]>
> {
  const res = await api.get<ApiResponse<BackendSubscriptionOverviewResponse>>(
    "/api/subscription/admin/all",
    {
      params: {
        page: 1,
        page_size: 100,
      },
    }
  );
  const payload = res.data;
  return {
    ...payload,
    data: (payload.data?.data || []).map(mapOverviewSubscription),
  };
}

export async function grantClaudeCodeSubscription(
  data: GrantSubscriptionData
): Promise<ApiResponse> {
  const res = await api.post(
    `/api/subscription/admin/users/${data.user_id}/subscriptions`,
    {
      plan_id: data.plan_id,
    }
  );
  return res.data;
}

export async function cancelClaudeCodeSubscription(
  id: number
): Promise<ApiResponse> {
  const res = await api.post(
    `/api/subscription/admin/user_subscriptions/${id}/invalidate`
  );
  return res.data;
}

// ============================================================================
// User APIs
// ============================================================================

export async function getMyClaudeCodeSubscriptions(): Promise<
  ApiResponse<VibeCodingSubscription[]>
> {
  const res = await api.get<ApiResponse<BackendSelfSubscriptionResponse>>(
    "/api/subscription/self"
  );
  const payload = res.data;
  const subscriptions = payload.data?.all_subscriptions || payload.data?.subscriptions || [];
  return {
    ...payload,
    data: subscriptions
      .map(mapSelfSubscription)
      .filter((item): item is VibeCodingSubscription => item !== null),
  };
}

export async function getClaudeCodePlans(): Promise<
  ApiResponse<VibeCodingPlan[]>
> {
  const res = await api.get<ApiResponse<BackendPlanRecord[]>>(
    "/api/subscription/plans"
  );
  const payload = res.data;
  return {
    ...payload,
    data: (payload.data || [])
      .map(mapPlan)
      .filter((item): item is VibeCodingPlan => item !== null),
  };
}

export async function purchaseClaudeCodeSubscription(data: {
  plan_id: number;
}): Promise<ApiResponse> {
  const res = await api.post("/api/subscription/balance/pay", data);
  return res.data;
}
