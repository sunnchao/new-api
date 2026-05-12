import { api } from "@/lib/api";
import type { PricingData } from "./types";

export async function getPricing(): Promise<PricingData> {
  const res = await api.get("/api/pricing");
  return res.data as PricingData;
}
