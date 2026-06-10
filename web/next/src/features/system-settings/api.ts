import { api } from "@/lib/api";
import type { ApiRequestOptions } from "@/lib/api-options";
import type {
  AffinityUsageCacheQuery,
  ApiResponse,
  CacheStats,
  ConfirmPaymentComplianceResponse,
  CustomOAuthProvider,
  DeleteLogsResponse,
  DiscoveryResponse,
  FetchUpstreamRatiosRequest,
  LogCleanupResult,
  PerformanceLogsInfo,
  PerformanceStats,
  SystemOptionsResponse,
  UpdateOptionRequest,
  UpdateOptionResponse,
  UpstreamChannelsResponse,
  UpstreamRatiosResponse,
  WaffoPancakeCatalogResponse,
  WaffoPancakePairResponse,
  WaffoPancakeSaveResponse,
} from "./types";

export async function getSystemStatus(): Promise<Record<string, unknown>> {
  const res = await api.get("/api/status");
  return res.data?.data ?? {};
}

export async function getSystemNotice(): Promise<ApiResponse<string>> {
  const res = await api.get("/api/notice");
  return res.data;
}

export async function getSystemOptions(): Promise<SystemOptionsResponse> {
  const res = await api.get("/api/option/");
  return res.data;
}

export async function updateSystemOption(
  request: UpdateOptionRequest,
): Promise<UpdateOptionResponse> {
  const res = await api.put("/api/option/", request);
  return res.data;
}

export async function migrateConsoleSetting(): Promise<UpdateOptionResponse> {
  const res = await api.post("/api/option/migrate_console_setting");
  return res.data;
}

export async function confirmPaymentCompliance(): Promise<ConfirmPaymentComplianceResponse> {
  const res = await api.post<ConfirmPaymentComplianceResponse>(
    "/api/option/payment_compliance",
    { confirmed: true },
  );
  return res.data;
}

export async function listWaffoPancakeCatalog(
  merchantID: string,
  privateKey: string,
): Promise<WaffoPancakeCatalogResponse> {
  const res = await api.post<WaffoPancakeCatalogResponse>(
    "/api/option/waffo-pancake/catalog",
    { merchant_id: merchantID, private_key: privateKey },
  );
  return res.data;
}

export async function createWaffoPancakePair(params: {
  merchantID: string
  privateKey: string
  returnURL: string
}): Promise<WaffoPancakePairResponse> {
  const res = await api.post<WaffoPancakePairResponse>(
    "/api/option/waffo-pancake/pair",
    {
      merchant_id: params.merchantID,
      private_key: params.privateKey,
      return_url: params.returnURL,
    },
  );
  return res.data;
}

export async function saveWaffoPancakeConfig(params: {
  merchantID: string
  privateKey: string
  returnURL: string
  storeID: string
  productID: string
}): Promise<WaffoPancakeSaveResponse> {
  const res = await api.post<WaffoPancakeSaveResponse>(
    "/api/option/waffo-pancake/save",
    {
      merchant_id: params.merchantID,
      private_key: params.privateKey,
      return_url: params.returnURL,
      store_id: params.storeID,
      product_id: params.productID,
    },
  );
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

export async function deleteLogsBefore(
  targetTimestamp: number,
): Promise<DeleteLogsResponse> {
  const res = await api.delete("/api/log/", {
    params: { target_timestamp: targetTimestamp },
  });
  return res.data;
}

export async function getUpstreamChannels(): Promise<UpstreamChannelsResponse> {
  const res = await api.get("/api/ratio_sync/channels");
  return res.data;
}

export async function fetchUpstreamRatios(
  request: FetchUpstreamRatiosRequest,
): Promise<UpstreamRatiosResponse> {
  const res = await api.post("/api/ratio_sync/fetch", request);
  return res.data;
}

export async function resetModelRatios(): Promise<UpdateOptionResponse> {
  const res = await api.post("/api/option/rest_model_ratio");
  return res.data;
}
