import { api } from "@/lib/api";
import { buildQueryParams } from "./lib";
import type {
  ApiResponse,
  GetLogsParams,
  GetLogStatsParams,
  GetMidjourneyLogsParams,
  GetTaskLogsParams,
  LogStatistics,
  LogsPageData,
  MidjourneyLog,
  TaskLog,
  UsageLog,
  UserInfo,
} from "./types";

function withPagination<T extends { p?: number; page_size?: number }>(
  params: T = {} as T,
): T {
  return {
    p: params.p ?? 1,
    page_size: params.page_size ?? 20,
    ...params,
  };
}

export async function getAllLogs(
  params: GetLogsParams = {},
): Promise<ApiResponse<LogsPageData<UsageLog>>> {
  const queryParams = buildQueryParams(withPagination(params));
  const res = await api.get(`/api/log?${queryParams}`);
  return res.data;
}

export async function getUserLogs(
  params: Omit<GetLogsParams, "username" | "channel"> = {},
): Promise<ApiResponse<LogsPageData<UsageLog>>> {
  const queryParams = buildQueryParams(withPagination(params));
  const res = await api.get(`/api/log/self?${queryParams}`);
  return res.data;
}

export async function getLogStats(
  params: GetLogStatsParams = {},
): Promise<ApiResponse<LogStatistics>> {
  const queryParams = buildQueryParams(params);
  const res = await api.get(`/api/log/stat?${queryParams}`);
  return res.data;
}

export async function getUserLogStats(
  params: Omit<GetLogStatsParams, "username" | "channel"> = {},
): Promise<ApiResponse<LogStatistics>> {
  const queryParams = buildQueryParams(params);
  const res = await api.get(`/api/log/self/stat?${queryParams}`);
  return res.data;
}

export async function getUserInfo(
  userId: number,
): Promise<ApiResponse<UserInfo>> {
  const res = await api.get(`/api/user/${userId}`);
  return res.data;
}

export async function getAllMidjourneyLogs(
  params: GetMidjourneyLogsParams,
): Promise<ApiResponse<LogsPageData<MidjourneyLog>>> {
  const queryParams = buildQueryParams(withPagination(params));
  const res = await api.get(`/api/mj?${queryParams}`);
  return res.data;
}

export async function getUserMidjourneyLogs(
  params: GetMidjourneyLogsParams,
): Promise<ApiResponse<LogsPageData<MidjourneyLog>>> {
  const queryParams = buildQueryParams(withPagination(params));
  const res = await api.get(`/api/mj/self?${queryParams}`);
  return res.data;
}

export async function getAllTaskLogs(
  params: GetTaskLogsParams,
): Promise<ApiResponse<LogsPageData<TaskLog>>> {
  const queryParams = buildQueryParams(withPagination(params));
  const res = await api.get(`/api/task?${queryParams}`);
  return res.data;
}

export async function getUserTaskLogs(
  params: GetTaskLogsParams,
): Promise<ApiResponse<LogsPageData<TaskLog>>> {
  const queryParams = buildQueryParams(withPagination(params));
  const res = await api.get(`/api/task/self?${queryParams}`);
  return res.data;
}
