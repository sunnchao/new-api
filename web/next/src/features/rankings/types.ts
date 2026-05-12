export type RankingPeriod = "today" | "week" | "month" | "year" | "all";

export interface RankingEntry {
  model_name: string;
  request_count: number;
  token_count: number;
}

export interface ModelRanking {
  model_name: string;
  total_tokens?: number;
  request_count?: number;
}

export interface RankingsSnapshot {
  models?: ModelRanking[];
}

export interface RankingsResponse {
  success?: boolean;
  message?: string;
  data?: RankingEntry[] | RankingsSnapshot;
}
