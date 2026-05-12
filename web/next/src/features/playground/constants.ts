export const PLAYGROUND_STORAGE_KEY = "playground:settings:v1";

export const PLAYGROUND_API_ENDPOINTS = {
  CHAT_COMPLETIONS: "/v1/chat/completions",
  USER_MODELS: "/api/user/models",
  USER_GROUPS: "/api/user/self/groups",
  API_KEYS: "/api/token/",
} as const;
