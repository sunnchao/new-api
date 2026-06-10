import { useSystemConfigStore } from "@/stores/system-config-store";

function finiteNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function trimZeros(value: string): string {
  return value.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function quotaUnitsToDollars(units: number | null | undefined): number {
  const quotaPerUnit = useSystemConfigStore.getState().config.currency.quotaPerUnit || 500000;
  return finiteNumber(units) / quotaPerUnit;
}

export function parseQuotaFromDollars(value: number | null | undefined): number {
  const quotaPerUnit = useSystemConfigStore.getState().config.currency.quotaPerUnit || 500000;
  return Math.round(finiteNumber(value) * quotaPerUnit);
}

export function formatQuota(quota: number | null | undefined): string {
  if (quota == null || Number.isNaN(quota)) return "-";

  const currency = useSystemConfigStore.getState().config.currency;
  if (currency.quotaDisplayType === "TOKENS") {
    return `${Math.round(quota).toLocaleString()} tokens`;
  }

  const amountUSD = quota / (currency.quotaPerUnit || 500000);
  const exchangeRate =
    currency.quotaDisplayType === "CUSTOM"
      ? currency.customCurrencyExchangeRate || 1
      : currency.quotaDisplayType === "CNY"
        ? currency.usdExchangeRate || 1
        : 1;
  const value = amountUSD * exchangeRate;

  if (currency.quotaDisplayType === "CNY") return `¥${trimZeros(value.toFixed(2))}`;
  if (currency.quotaDisplayType === "CUSTOM") {
    return `${currency.customCurrencySymbol || ""}${trimZeros(value.toFixed(2))}`;
  }
  return `$${trimZeros(amountUSD.toFixed(2))}`;
}

export function formatTimestamp(timestamp: number | null | undefined): string {
  if (!timestamp || timestamp <= 0) return "-";
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatTimestampToDate(
  timestamp: number | null | undefined,
  unit: "seconds" | "milliseconds" = "seconds",
): string {
  if (!timestamp || timestamp <= 0) return "-";
  return new Date(unit === "milliseconds" ? timestamp : timestamp * 1000).toLocaleString();
}

export function formatTimestampToDateOnly(timestamp: number | null | undefined): string {
  if (!timestamp || timestamp <= 0) return "-";
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function formatTimestampForInput(timestamp: number | null | undefined): string {
  if (!timestamp || timestamp <= 0) return "";
  const date = new Date(timestamp * 1000);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function dateTimeLocalToTimestamp(value: string): number {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.floor(date.getTime() / 1000);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value as number)) return "-";
  return Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value as number);
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value as number)) return "-";
  return Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value as number);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value as number)) return "-";
  return Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format((value as number) / 100);
}

export function formatCurrencyUSD(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value as number)) return "-";
  return `$${value.toFixed(2)}`;
}

export function formatLogQuota(quota: number | null | undefined): string {
  return formatQuota(quota);
}

export function formatUseTime(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return "-";
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
}

export function formatTokens(tokens: number | null | undefined): string {
  if (tokens == null || Number.isNaN(tokens)) return "-";
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${tokens}`;
}
