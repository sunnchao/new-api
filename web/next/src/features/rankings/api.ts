import { api } from "@/lib/api";
import type { RankingPeriod, RankingsResponse } from "./types";

export async function getRankings(period: RankingPeriod): Promise<RankingsResponse> {
  const res = await api.get("/api/rankings", { params: { period } });
  return res.data;
}
