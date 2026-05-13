import type {
  CommonLogFilters,
  GetLogsParams,
  GetMidjourneyLogsParams,
  GetTaskLogsParams,
  LogCategory,
  TaskLikeFilters,
} from "./types";
import {
  LOG_TYPES,
  TASK_ACTION_MAPPINGS,
  TASK_STATUS_MAPPINGS,
} from "./constants";

export function buildQueryParams(params: object): URLSearchParams {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  return queryParams;
}

export function coerceUsageLogsSection(section?: string): LogCategory {
  if (section === "drawing" || section === "task" || section === "common") {
    return section;
  }
  return "common";
}

export function getLogTypeConfig(type: number) {
  return LOG_TYPES.find((item) => item.value === type) ?? LOG_TYPES[0];
}

export function getTaskStatusConfig(status?: string) {
  if (!status) return TASK_STATUS_MAPPINGS.UNKNOWN;
  return TASK_STATUS_MAPPINGS[status] ?? {
    label: status,
    variant: "neutral" as const,
  };
}

export function getTaskActionConfig(action?: string) {
  if (!action) {
    return {
      label: "-",
      variant: "neutral" as const,
    };
  }

  return TASK_ACTION_MAPPINGS[action] ?? {
    label: action,
    variant: "neutral" as const,
  };
}

export function toApiTimestamp(value: string, unit: "seconds" | "milliseconds") {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return undefined;
  return unit === "milliseconds" ? timestamp : Math.floor(timestamp / 1000);
}

export function buildCommonLogParams(
  filters: CommonLogFilters,
  page: number,
  pageSize: number,
  isAdmin: boolean,
): GetLogsParams {
  return {
    p: page,
    page_size: pageSize,
    ...(filters.type && filters.type !== "all" ? { type: Number(filters.type) } : {}),
    ...(filters.model ? { model_name: filters.model.trim() } : {}),
    ...(filters.token ? { token_name: filters.token.trim() } : {}),
    ...(filters.group ? { group: filters.group.trim() } : {}),
    ...(filters.requestId ? { request_id: filters.requestId.trim() } : {}),
    ...(isAdmin && filters.username ? { username: filters.username.trim() } : {}),
    ...(isAdmin && filters.channel ? { channel: Number(filters.channel) || 0 } : {}),
    ...(filters.startTime
      ? { start_timestamp: toApiTimestamp(filters.startTime, "seconds") }
      : {}),
    ...(filters.endTime
      ? { end_timestamp: toApiTimestamp(filters.endTime, "seconds") }
      : {}),
  };
}

export function buildTaskLikeParams(
  category: Extract<LogCategory, "drawing" | "task">,
  filters: TaskLikeFilters,
  page: number,
  pageSize: number,
): GetMidjourneyLogsParams | GetTaskLogsParams {
  const useMilliseconds = category === "drawing";
  const base = {
    p: page,
    page_size: pageSize,
    ...(filters.channel ? { channel_id: filters.channel.trim() } : {}),
    ...(filters.startTime
      ? {
          start_timestamp: toApiTimestamp(
            filters.startTime,
            useMilliseconds ? "milliseconds" : "seconds",
          ),
        }
      : {}),
    ...(filters.endTime
      ? {
          end_timestamp: toApiTimestamp(
            filters.endTime,
            useMilliseconds ? "milliseconds" : "seconds",
          ),
        }
      : {}),
  };

  if (category === "drawing") {
    return {
      ...base,
      ...(filters.filter ? { mj_id: filters.filter.trim() } : {}),
    };
  }

  return {
    ...base,
    ...(filters.filter ? { task_id: filters.filter.trim() } : {}),
  };
}

export function formatCount(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return "-";
  return value.toLocaleString();
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return "-";
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 2 : 1)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}m ${rest}s`;
}

export function formatUnixSeconds(timestamp?: number | null): string {
  if (!timestamp || timestamp <= 0) return "-";
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatUnixMilliseconds(timestamp?: number | null): string {
  if (!timestamp || timestamp <= 0) return "-";
  return new Date(timestamp).toLocaleString();
}

export function getProgressValue(progress?: string): number {
  if (!progress) return 0;
  const match = progress.match(/\d+(\.\d+)?/);
  if (!match) return 0;
  const value = Number(match[0]);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function truncateMiddle(value: string, head = 16, tail = 10): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
