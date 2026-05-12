import axios from "axios";
import type { AxiosResponse } from "axios";
import i18next from "i18next";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiRequestOptions } from "./api-options";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    "Cache-Control": "no-store",
  },
});

const inFlightGet = new Map<string, Promise<AxiosResponse<unknown>>>();
const originalGet = api.get.bind(api);

function getUserId(): string | null {
  try {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("uid");
    }
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
  return null;
}

function getRequestKey(url: string, config?: ApiRequestOptions): string {
  const params = config?.params ? JSON.stringify(config.params) : "{}";
  return `${url}?${params}`;
}

function resetAuthState() {
  try {
    const state = useAuthStore.getState() as ReturnType<typeof useAuthStore.getState> & {
      auth?: { reset?: () => void };
    };

    if (typeof state.auth?.reset === "function") {
      state.auth.reset();
      return;
    }

    if (typeof state.reset === "function") {
      state.reset();
      return;
    }

    if (typeof state.setUser === "function") {
      state.setUser(null);
      return;
    }
  } catch {
    // Fall back to clearing browser storage below.
  }

  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("uid");
    }
  } catch {
    // Ignore storage failures during auth cleanup.
  }
}

api.get = ((url: string, config?: ApiRequestOptions) => {
  if (config?.disableDuplicate) {
    return originalGet(url, config);
  }

  const key = getRequestKey(url, config);
  const existing = inFlightGet.get(key);
  if (existing) return existing;

  const request = originalGet(url, config).finally(() => {
    inFlightGet.delete(key);
  });
  inFlightGet.set(key, request);
  return request;
}) as typeof api.get;

api.interceptors.request.use((config) => {
  const uid = getUserId();
  if (uid) {
    config.headers.set("New-Api-User", uid);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const skipBusinessError = (response.config as ApiRequestOptions).skipBusinessError;
    const data = response.data as ApiResponse | undefined;

    if (!skipBusinessError && typeof data?.success === "boolean" && !data.success) {
      toast.error(data.message || "Request failed");
    }

    return response;
  },
  (error) => {
    const skipErrorHandler = (error?.config as ApiRequestOptions | undefined)?.skipErrorHandler;

    if (!skipErrorHandler) {
      const status = error?.response?.status;
      if (status === 401) {
        toast.error(i18next.t("Session expired!"));
        resetAuthState();
      } else {
        const message = error?.response?.data?.message || error?.message || "Request error";
        toast.error(message);
      }
    }

    return Promise.reject(error);
  },
);

export function getCommonHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const uid = getUserId();
  if (uid) {
    headers["New-Api-User"] = uid;
  }

  return headers;
}

export async function getSelf(): Promise<ApiResponse> {
  const res = await api.get<ApiResponse>("/api/user/self", {
    skipErrorHandler: true,
  } as ApiRequestOptions);
  return res.data;
}

export async function getUserModels(): Promise<ApiResponse<string[]>> {
  const res = await api.get<ApiResponse<string[]>>("/api/user/models");
  return res.data;
}

export async function getUserGroups(): Promise<
  ApiResponse<Record<string, { desc: string; ratio: number | string }>>
> {
  const res = await api.get<ApiResponse<Record<string, { desc: string; ratio: number | string }>>>(
    "/api/user/self/groups",
  );
  return res.data;
}

export async function getStatus(): Promise<Record<string, unknown>> {
  const res = await api.get<ApiResponse<Record<string, unknown>>>("/api/status");
  return res.data?.data ?? {};
}

export async function getNotice(): Promise<ApiResponse<string>> {
  const res = await api.get<ApiResponse<string>>("/api/notice");
  return res.data;
}

export async function getSetupStatus(): Promise<ApiResponse<{ required?: boolean }>> {
  const res = await api.get<ApiResponse<{ required?: boolean }>>("/api/setup");
  return res.data;
}

export async function checkSetupRequired(): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem("setup_required");
      if (cached === "false") return false;
    }

    const res = await getSetupStatus();
    const required = res.data?.required ?? false;

    if (typeof window !== "undefined") {
      window.localStorage.setItem("setup_required", String(required));
    }

    return required;
  } catch {
    return false;
  }
}

export default api;
