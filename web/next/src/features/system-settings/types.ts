export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface CustomOAuthProvider {
  id: number;
  name: string;
  slug: string;
  icon: string;
  enabled: boolean;
  client_id: string;
  client_secret?: string;
  authorization_endpoint: string;
  token_endpoint: string;
  user_info_endpoint: string;
  scopes: string;
  user_id_field: string;
  username_field: string;
  display_name_field: string;
  email_field: string;
  well_known: string;
  auth_style: number;
  access_policy: string;
  access_denied_message: string;
}

export interface DiscoveryResponse {
  success: boolean;
  message?: string;
  data?: {
    well_known_url?: string;
    discovery?: {
      authorization_endpoint?: string;
      token_endpoint?: string;
      userinfo_endpoint?: string;
      scopes_supported?: string[];
    };
  };
}

export interface CacheStats {
  enabled: boolean;
  total: number;
  unknown: number;
  by_rule_name: Record<string, number>;
  cache_capacity: number;
  cache_algo: string;
}

export interface AffinityUsageCacheQuery {
  rule_name: string;
  using_group: string;
  key_hint: string;
  key_fp: string;
}

export interface PerformanceStats {
  cache_stats?: {
    current_disk_usage_bytes?: number;
    disk_cache_max_bytes?: number;
    active_disk_files?: number;
    disk_cache_hits?: number;
    current_memory_usage_bytes?: number;
    active_memory_buffers?: number;
    memory_cache_hits?: number;
  };
  memory_stats?: {
    alloc?: number;
    total_alloc?: number;
    sys?: number;
    num_gc?: number;
    num_goroutine?: number;
  };
  disk_cache_info?: {
    path?: string;
    exists?: boolean;
    file_count?: number;
    total_size?: number;
  };
  disk_space_info?: {
    total?: number;
    free?: number;
    used?: number;
    used_percent?: number;
  };
  config?: {
    disk_cache_enabled?: boolean;
    disk_cache_threshold_mb?: number;
    disk_cache_max_size_mb?: number;
    disk_cache_path?: string;
    is_running_in_container?: boolean;
    monitor_enabled?: boolean;
    monitor_cpu_threshold?: number;
    monitor_memory_threshold?: number;
    monitor_disk_threshold?: number;
  };
}

export interface LogFileInfo {
  name: string;
  size: number;
  mod_time: string;
}

export interface PerformanceLogsInfo {
  enabled: boolean;
  log_dir?: string;
  file_count?: number;
  total_size?: number;
  oldest_time?: string;
  newest_time?: string;
  files?: LogFileInfo[];
}

export interface LogCleanupResult {
  deleted_count: number;
  freed_bytes: number;
  failed_files?: string[];
}
