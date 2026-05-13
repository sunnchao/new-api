import { api } from "@/lib/api";
import type { ApiRequestOptions } from "@/lib/api-options";
import type {
  AffinityUsageCacheQuery,
  ApiResponse,
  CacheStats,
  CustomOAuthProvider,
  DiscoveryResponse,
  LogCleanupResult,
  PerformanceLogsInfo,
  PerformanceStats,
} from "./types";

export async function getSystemStatus(): Promise<Record<string, unknown>> {
  const res = await api.get("/api/status");
  return res.data?.data ?? {};
}

export async function getSystemNotice(): Promise<ApiResponse<string>> {
  const res = await api.get("/api/notice");
  return res.data;
}

export async function getCustomOAuthProviders(): Promise<
  ApiResponse<CustomOAuthProvider[]>
> {
  const res = await api.get("/api/custom-oauth-provider/");
  return res.data;
}

export async function getCustomOAuthProvider(
  id: number,
): Promise<ApiResponse<CustomOAuthProvider>> {
  const res = await api.get(`/api/custom-oauth-provider/${id}`);
  return res.data;
}

export async function createCustomOAuthProvider(
  data: Omit<CustomOAuthProvider, "id">,
): Promise<ApiResponse<CustomOAuthProvider>> {
  const res = await api.post("/api/custom-oauth-provider/", data);
  return res.data;
}

export async function updateCustomOAuthProvider(
  id: number,
  data: Partial<CustomOAuthProvider>,
): Promise<ApiResponse<CustomOAuthProvider>> {
  const res = await api.put(`/api/custom-oauth-provider/${id}`, data);
  return res.data;
}

export async function deleteCustomOAuthProvider(
  id: number,
): Promise<ApiResponse> {
  const res = await api.delete(`/api/custom-oauth-provider/${id}`);
  return res.data;
}

export async function discoverOIDCEndpoints(
  wellKnownUrl: string,
): Promise<DiscoveryResponse> {
  const res = await api.post("/api/custom-oauth-provider/discovery", {
    well_known_url: wellKnownUrl,
  });
  return res.data;
}

export async function getChannelAffinityCache(): Promise<
  ApiResponse<CacheStats>
> {
  const res = await api.get("/api/option/channel_affinity_cache", {
    disableDuplicate: true,
  } as ApiRequestOptions);
  return res.data;
}

export async function clearChannelAffinityCache(
  ruleName?: string,
): Promise<ApiResponse<{ deleted: number }>> {
  const res = await api.delete("/api/option/channel_affinity_cache", {
    params: ruleName ? { rule_name: ruleName } : { all: true },
  });
  return res.data;
}

export async function getChannelAffinityUsageCache(
  params: AffinityUsageCacheQuery,
): Promise<ApiResponse<unknown>> {
  const res = await api.get("/api/log/channel_affinity_usage_cache", {
    params,
    disableDuplicate: true,
  } as ApiRequestOptions);
  return res.data;
}

export async function getPerformanceStats(): Promise<
  ApiResponse<PerformanceStats>
> {
  const res = await api.get("/api/performance/stats");
  return res.data;
}

export async function clearDiskCache(): Promise<ApiResponse> {
  const res = await api.delete("/api/performance/disk_cache");
  return res.data;
}

export async function resetPerformanceStats(): Promise<ApiResponse> {
  const res = await api.post("/api/performance/reset_stats");
  return res.data;
}

export async function forceGC(): Promise<ApiResponse> {
  const res = await api.post("/api/performance/gc");
  return res.data;
}

export async function getPerformanceLogs(): Promise<
  ApiResponse<PerformanceLogsInfo>
> {
  const res = await api.get("/api/performance/logs");
  return res.data;
}

export async function cleanupPerformanceLogs(
  logCleanupMode: string,
  logCleanupValue: number,
): Promise<ApiResponse<LogCleanupResult>> {
  const res = await api.delete(
    `/api/performance/logs?mode=${logCleanupMode}&value=${logCleanupValue}`,
  );
  return res.data;
}
