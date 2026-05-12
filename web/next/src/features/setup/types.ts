export type UsageMode = "personal" | "multi";

export interface SetupInfo {
  status?: boolean;
  root_init?: boolean;
  database_type?: string;
}

export interface SetupResponse {
  success: boolean;
  message?: string;
  data?: SetupInfo;
}
