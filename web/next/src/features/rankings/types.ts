export type RankingPeriod = "today" | "week" | "month" | "year" | "all";

export type ModelRanking = {
  rank: number;
  previous_rank?: number;
  model_name: string;
  vendor: string;
  vendor_icon?: string;
  category: string;
  total_tokens: number;
  share: number;
  growth_pct: number;
};

export type VendorRanking = {
  rank: number;
  vendor: string;
  vendor_icon?: string;
  total_tokens: number;
  share: number;
  growth_pct: number;
  models_count: number;
  top_model: string;
};

export type RankingMover = {
  model_name: string;
  vendor: string;
  vendor_icon?: string;
  rank_delta: number;
  current_rank: number;
  growth_pct: number;
};

export type ModelHistoryPoint = {
  ts: string;
  label: string;
  model: string;
  vendor: string;
  tokens: number;
};

export type ModelHistorySeries = {
  points: ModelHistoryPoint[];
  models: Array<{ name: string; vendor: string; total: number }>;
  buckets: number;
};

export type VendorSharePoint = {
  ts: string;
  label: string;
  vendor: string;
  share: number;
  tokens: number;
};

export type VendorShareSeries = {
  points: VendorSharePoint[];
  vendors: Array<{ name: string; total: number; share: number }>;
  buckets: number;
};

export type RankingsSnapshot = {
  models: ModelRanking[];
  vendors: VendorRanking[];
  top_movers: RankingMover[];
  top_droppers: RankingMover[];
  models_history: ModelHistorySeries;
  vendor_share_history: VendorShareSeries;
};

export type RankingsResponse = {
  success: boolean;
  message?: string;
  data: RankingsSnapshot;
};
