import { api } from "@/lib/api";
import type { ApiRequestOptions } from "@/lib/api-options";
import type { SetupResponse } from "./types";

export async function getSetupStatus(): Promise<SetupResponse> {
  const res = await api.get("/api/setup", {
    params: { t: Date.now() },
    disableDuplicate: true,
  } as ApiRequestOptions);
  return res.data as SetupResponse;
}

export async function submitSetup(payload: Record<string, unknown>): Promise<SetupResponse> {
  const res = await api.post("/api/setup", payload);
  return res.data as SetupResponse;
}
