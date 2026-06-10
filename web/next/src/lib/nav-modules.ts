export type HeaderNavAccessConfig = {
  enabled: boolean;
  requireAuth: boolean;
};

export type HeaderNavAccessModule = "pricing" | "subscriptions" | "rankings";

export type HeaderNavModulesConfig = {
  home: boolean;
  console: boolean;
  pricing: HeaderNavAccessConfig;
  subscriptions: HeaderNavAccessConfig;
  rankings: HeaderNavAccessConfig;
  vibecoding: boolean;
  docs: boolean;
  about: boolean;
  contact: boolean;
  [key: string]: boolean | HeaderNavAccessConfig;
};

export const HEADER_NAV_DEFAULT: HeaderNavModulesConfig = {
  home: true,
  console: true,
  pricing: {
    enabled: true,
    requireAuth: false,
  },
  subscriptions: {
    enabled: true,
    requireAuth: false,
  },
  rankings: {
    enabled: false,
    requireAuth: false,
  },
  vibecoding: true,
  docs: true,
  about: true,
  contact: true,
};

const ACCESS_MODULES = new Set(["pricing", "subscriptions", "rankings"]);

export function parseHeaderNavBoolean(
  value: unknown,
  fallback: boolean,
): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return fallback;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return fallback;
}

function cloneHeaderNavDefault(): HeaderNavModulesConfig {
  return {
    ...HEADER_NAV_DEFAULT,
    pricing: { ...HEADER_NAV_DEFAULT.pricing },
    subscriptions: { ...HEADER_NAV_DEFAULT.subscriptions },
    rankings: { ...HEADER_NAV_DEFAULT.rankings },
  };
}

function parseAccessModule(
  raw: unknown,
  fallback: HeaderNavAccessConfig,
): HeaderNavAccessConfig {
  if (
    typeof raw === "boolean" ||
    typeof raw === "number" ||
    typeof raw === "string"
  ) {
    return {
      enabled: parseHeaderNavBoolean(raw, fallback.enabled),
      requireAuth: fallback.requireAuth,
    };
  }

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    return {
      enabled: parseHeaderNavBoolean(record.enabled, fallback.enabled),
      requireAuth: parseHeaderNavBoolean(record.requireAuth, fallback.requireAuth),
    };
  }

  return { ...fallback };
}

function parseHeaderNavRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || String(raw).trim() === "") return null;
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;

  try {
    return JSON.parse(String(raw)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseHeaderNavModules(raw: unknown): HeaderNavModulesConfig {
  const result = cloneHeaderNavDefault();
  const parsed = parseHeaderNavRecord(raw);
  if (!parsed) return result;

  Object.entries(parsed).forEach(([key, value]) => {
    if (ACCESS_MODULES.has(key)) {
      const fallback = result[key];
      if (fallback && typeof fallback === "object") {
        result[key] = parseAccessModule(value, fallback);
      }
      return;
    }

    const fallback = result[key];
    if (
      typeof fallback === "boolean" ||
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string"
    ) {
      result[key] = parseHeaderNavBoolean(
        value,
        typeof fallback === "boolean" ? fallback : true,
      );
    }
  });

  return result;
}

export function parseHeaderNavModulesFromStatus(
  status: Record<string, unknown> | null | undefined,
): HeaderNavModulesConfig {
  return parseHeaderNavModules(status?.HeaderNavModules);
}

export function serializeHeaderNavModules(config: HeaderNavModulesConfig): string {
  return JSON.stringify(config);
}
