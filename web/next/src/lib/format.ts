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

export function formatTimestampToDate(timestamp: number | null | undefined): string {
  if (!timestamp || timestamp <= 0) return "-";
  return new Date(timestamp * 1000).toLocaleString();
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
