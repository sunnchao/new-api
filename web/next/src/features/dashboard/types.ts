export interface QuotaDataItem {
  timestamp?: number;
  model_name?: string;
  username?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  request_count?: number;
  used_quota?: number;
  quota?: number;
}

export interface UptimeGroupResult {
  group_name?: string;
  name?: string;
  status?: string;
  uptime?: number;
  response_time?: number;
  updated_at?: string;
}

export type DashboardSectionId = "overview" | "models" | "users";
