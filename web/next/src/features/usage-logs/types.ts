export type LogCategory = "common" | "drawing" | "task";

export interface UsageLog {
  id: number;
  user_id: number;
  created_at: number;
  type: number;
  content: string;
  username?: string;
  token_name?: string;
  model_name?: string;
  quota?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  use_time?: number;
  is_stream?: boolean;
  channel?: number;
  channel_name?: string | null;
  token_id?: number;
  group?: string;
  ip?: string;
  request_ip?: string;
  other?: string;
  request_id?: string;
}

export interface MidjourneyLog {
  id: number;
  user_id: number;
  channel_id: number;
  code: number;
  mj_id: string;
  action: string;
  submit_time: number;
  finish_time?: number;
  start_time?: number;
  fail_reason?: string;
  progress: string;
  prompt: string;
  prompt_en?: string;
  description?: string;
  buttons?: string;
  properties?: string;
  image_url?: string;
  video_url?: string;
  video_urls?: string;
  status: string;
  other?: string;
}

export interface TaskLog {
  id: number;
  created_at?: number;
  updated_at?: number;
  user_id: number;
  username?: string;
  platform: string;
  task_id: string;
  action: string;
  channel_id: number;
  quota?: number;
  submit_time: number;
  start_time?: number;
  finish_time?: number;
  progress?: string;
  result_url?: string;
  data?: unknown;
  fail_reason?: string;
  status: string;
  group?: string;
  properties?: unknown;
}

export interface LogsPageData<TLog> {
  items: TLog[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiResponse<TData = unknown> {
  success: boolean;
  message?: string;
  data?: TData;
}

export interface GetLogsParams {
  p?: number;
  page_size?: number;
  type?: number;
  username?: string;
  token_name?: string;
  model_name?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  channel?: number;
  group?: string;
  request_id?: string;
}

export interface GetLogStatsParams {
  type?: number;
  username?: string;
  token_name?: string;
  model_name?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  channel?: number;
  group?: string;
  request_id?: string;
}

export interface LogStatistics {
  quota: number;
  rpm: number;
  tpm: number;
}

export interface GetMidjourneyLogsParams {
  p?: number;
  page_size?: number;
  channel_id?: string;
  mj_id?: string;
  start_timestamp?: number;
  end_timestamp?: number;
}

export interface GetTaskLogsParams {
  p?: number;
  page_size?: number;
  channel_id?: string;
  task_id?: string;
  start_timestamp?: number;
  end_timestamp?: number;
}

export interface UserInfo {
  id: number;
  username: string;
  display_name?: string;
  email?: string;
  quota: number;
  used_quota: number;
  request_count: number;
  group?: string;
  aff_code?: string;
  aff_count?: number;
  aff_quota?: number;
  remark?: string;
}

export interface CommonLogFilters {
  startTime: string;
  endTime: string;
  type: string;
  model: string;
  token: string;
  group: string;
  username: string;
  channel: string;
  requestId: string;
}

export interface TaskLikeFilters {
  startTime: string;
  endTime: string;
  filter: string;
  channel: string;
}
