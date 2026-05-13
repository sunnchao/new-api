export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface UserProfile {
  id: number;
  username: string;
  display_name: string;
  role: number;
  email?: string;
  group: string;
  quota: number;
  used_quota: number;
  request_count: number;
  status: number;
  access_token?: string;
  aff_code?: string;
  aff_count: number;
  aff_quota: number;
  aff_history_quota: number;
  invite_user_id?: number;
  created_time: number;
  setting?: string;
  wechat_id?: string;
  github_id?: string;
  discord_id?: string;
  oidc_id?: string;
  telegram_id?: string;
  linux_do_id?: string;
}

export type NotifyType = "email" | "webhook" | "bark" | "gotify";

export interface UserSettings {
  notify_type?: NotifyType;
  quota_warning_threshold?: number;
  webhook_url?: string;
  webhook_secret?: string;
  notification_email?: string;
  bark_url?: string;
  gotify_url?: string;
  gotify_token?: string;
  gotify_priority?: number;
  accept_unset_model_ratio_model?: boolean;
  record_ip_log?: boolean;
  upstream_model_update_notify_enabled?: boolean;
  language?: string;
}

export interface UpdateUserRequest {
  display_name?: string;
  password?: string;
  original_password?: string;
}

export interface CheckinRecord {
  checkin_date: string;
  quota_awarded: number;
}

export interface CheckinStats {
  checked_in_today: boolean;
  total_checkins: number;
  total_quota: number;
  checkin_count: number;
  records: CheckinRecord[];
}

export interface CheckinStatusResponse {
  enabled: boolean;
  stats: CheckinStats;
}

export interface CheckinResponse {
  quota_awarded: number;
}

export type UserProfilePayload = Record<string, unknown>;
