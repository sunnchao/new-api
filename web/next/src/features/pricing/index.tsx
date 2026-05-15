"use client";

import { PublicLayout } from "@/components/layout/public-layout";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Cpu,
  ArrowUpRight,
  Type,
  Image,
  Mic,
  Video,
  FileText,
  Zap,
  Sparkles,
  ChevronDown,
  X,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getPricing } from "./api";
import type {
  PricingData,
  PricingModel,
  Modality,
  ModelCapability,
} from "./types";

type SortOption = "name" | "price-low" | "price-high";

const VENDOR_HUES = [
  "221",
  "262",
  "174",
  "33",
  "340",
  "199",
  "142",
  "15",
  "280",
  "52",
];

function vendorColor(name: string, index: number) {
  const hue = VENDOR_HUES[index % VENDOR_HUES.length];
  return {
    bg: `hsla(${hue}, 60%, 55%, 0.08)`,
    border: `hsla(${hue}, 60%, 55%, 0.25)`,
    text: `hsl(${hue}, 60%, 55%)`,
    strip: `hsl(${hue}, 60%, 55%)`,
  };
}

const MODALITY_ICONS: Record<Modality, React.ComponentType<{ className?: string }>> = {
  text: Type,
  image: Image,
  audio: Mic,
  video: Video,
  file: FileText,
};

const CAPABILITY_LABELS: Partial<Record<ModelCapability, string>> = {
  function_calling: "FC",
  streaming: "STR",
  vision: "VIS",
  json_mode: "JSON",
  structured_output: "STO",
  reasoning: "RSN",
  tools: "TL",
  web_search: "WS",
  caching: "CAH",
  embeddings: "EMB",
  code_interpreter: "CI",
  system_prompt: "SP",
};

export function PricingPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [quotaFilter, setQuotaFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("name");
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    getPricing()
      .then((res) => {
        if (res) setData(res);
      })
      .finally(() => setLoading(false));
  }, []);

  const models = data?.data ?? [];
  const vendors = data?.vendors ?? [];

  const vendorIndexMap = useMemo(() => {
    const m = new Map<string, number>();
    vendors.forEach((v, i) => m.set(v.name, i));
    return m;
  }, [vendors]);

  const filtered = useMemo(() => {
    let list = models.filter((m) => {
      if (
        search &&
        !m.model_name.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (vendorFilter !== "all" && m.vendor_name !== vendorFilter)
        return false;
      if (quotaFilter === "token" && m.quota_type !== 0) return false;
      if (quotaFilter === "request" && m.quota_type !== 1) return false;
      return true;
    });
    if (sort === "name")
      list.sort((a, b) => a.model_name.localeCompare(b.model_name));
    else if (sort === "price-low")
      list.sort((a, b) => a.model_ratio - b.model_ratio);
    else if (sort === "price-high")
      list.sort((a, b) => b.model_ratio - a.model_ratio);
    return list;
  }, [models, search, vendorFilter, quotaFilter, sort]);

  const formatPrice = useCallback((ratio: number) => {
    if (ratio === 0) return "Free";
    return `$${((ratio * 2) / 1000000).toFixed(4)}/1M`;
  }, []);

  const formatShortPrice = useCallback((ratio: number) => {
    if (ratio === 0) return "Free";
    const val = (ratio * 2) / 1000000;
    if (val < 0.01) return `$${val.toFixed(5)}`;
    if (val < 1) return `$${val.toFixed(4)}`;
    return `$${val.toFixed(2)}`;
  }, []);

  const SORT_LABELS: Record<SortOption, string> = {
    name: t("pricing.sortName", { defaultValue: "Name" }),
    "price-low": t("pricing.sortPriceLow", { defaultValue: "Price ↑" }),
    "price-high": t("pricing.sortPriceHigh", { defaultValue: "Price ↓" }),
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── Hero ─── */}
        <div className="relative pt-16 pb-10 text-center overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, hsla(221,60%,55%,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/50 px-3.5 py-1.5 text-xs font-medium text-[var(--muted)] mb-5 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            {loading
              ? t("pricing.loading", { defaultValue: "Loading models…" })
              : t("pricing.modelCount", {
                  defaultValue: "{{count}} models available",
                  count: models.length,
                })}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--muted)] bg-clip-text text-transparent">
              {t("pricing.title")}
            </span>
          </h1>
          <p className="text-[var(--muted)] max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            {t("pricing.allModelsDescription")}
          </p>
        </div>

        {/* ─── Toolbar ─── */}
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]/50 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
              <Input
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-[var(--surface)]/50 border-[var(--border)]/60 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Vendor chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 pb-0.5 sm:pb-0">
              <VendorChip
                active={vendorFilter === "all"}
                onClick={() => setVendorFilter("all")}
              >
                {t("pricing.allVendors", { defaultValue: "All" })}
              </VendorChip>
              {vendors.map((v, i) => {
                const vc = vendorColor(v.name, i);
                const active = vendorFilter === v.name;
                return (
                  <VendorChip
                    key={v.id}
                    active={active}
                    onClick={() =>
                      setVendorFilter(active ? "all" : v.name)
                    }
                    style={active ? vc : undefined}
                  >
                    {v.name}
                  </VendorChip>
                );
              })}
            </div>

            {/* Quota type toggle */}
            <div className="flex items-center rounded-lg border border-[var(--border)]/60 bg-[var(--surface)]/30 p-0.5 text-xs font-medium shrink-0">
              {(
                [
                  ["all", t("pricing.allTypes", { defaultValue: "All" })],
                  [
                    "token",
                    t("pricing.tokenBased", { defaultValue: "Token" }),
                  ],
                  [
                    "request",
                    t("pricing.perRequest", { defaultValue: "Request" }),
                  ],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setQuotaFilter(val)}
                  className={`rounded-md px-2.5 py-1.5 transition-all ${
                    quotaFilter === val
                      ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative shrink-0">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1.5 h-9 rounded-lg border border-[var(--border)]/60 bg-[var(--surface)]/30 px-3 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                {SORT_LABELS[sort]}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1.5 w-36 rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg z-30 overflow-hidden"
                  >
                    {(
                      [
                        ["name", SORT_LABELS.name],
                        ["price-low", SORT_LABELS["price-low"]],
                        ["price-high", SORT_LABELS["price-high"]],
                      ] as const
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => {
                          setSort(val);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                          sort === val
                            ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                            : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Result count */}
          <div className="mt-2 text-xs text-[var(--muted)]">
            {filtered.length === models.length
              ? `${models.length} models`
              : `${filtered.length} of ${models.length} models`}
          </div>
        </div>

        {/* ─── Grid ─── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <CardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilters={search !== "" || vendorFilter !== "all" || quotaFilter !== "all"}
            onClear={() => {
              setSearch("");
              setVendorFilter("all");
              setQuotaFilter("all");
            }}
            t={t}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
            {filtered.map((model, i) => (
              <ModelCard
                key={model.model_name}
                model={model}
                vendorColor={
                  vendorColor(
                    model.vendor_name ?? "",
                    vendorIndexMap.get(model.vendor_name ?? "") ?? 0
                  )
                }
                formatPrice={formatPrice}
                formatShortPrice={formatShortPrice}
                t={t}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

/* ──────────── Vendor Chip ──────────── */

function VendorChip({
  active,
  onClick,
  style,
  children,
}: {
  active: boolean;
  onClick: () => void;
  style?: { bg?: string; border?: string; text?: string };
  children: React.ReactNode;
}) {
  const base = "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all border";
  const cls =
    active && style
      ? base
      : active
      ? `${base} bg-[var(--foreground)]/10 border-[var(--foreground)]/20 text-[var(--foreground)]`
      : `${base} border-[var(--border)]/40 text-[var(--muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]`;

  return (
    <button
      onClick={onClick}
      className={cls}
      style={
        active && style
          ? {
              backgroundColor: style.bg,
              borderColor: style.border,
              color: style.text,
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

/* ──────────── Model Card ──────────── */

function ModelCard({
  model,
  vendorColor: vc,
  formatPrice,
  formatShortPrice,
  t,
  index,
}: {
  model: PricingModel;
  vendorColor: ReturnType<typeof vendorColor>;
  formatPrice: (r: number) => string;
  formatShortPrice: (r: number) => string;
  t: (k: string, opts?: Record<string, string>) => string;
  index: number;
}) {
  const modalities = model.input_modalities ?? [];
  const capabilities = model.capabilities ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link href={`/pricing/${encodeURIComponent(model.model_name)}`} className="block group">
        <div className="relative overflow-hidden rounded-xl border border-[var(--border)]/60 bg-[var(--background)] transition-all duration-200 hover:border-[var(--accent-muted)]/40 hover:shadow-lg hover:shadow-[var(--accent)]/[0.03]">
          {/* Vendor accent strip */}
          <div
            className="h-[3px] w-full"
            style={{ backgroundColor: vc.strip }}
          />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                  {model.model_name}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {model.vendor_name && (
                    <span
                      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border"
                      style={{
                        backgroundColor: vc.bg,
                        borderColor: vc.border,
                        color: vc.text,
                      }}
                    >
                      {model.vendor_name}
                    </span>
                  )}
                  {model.quota_type === 1 && (
                    <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      Per Request
                    </span>
                  )}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[var(--muted)] opacity-0 -translate-y-0.5 translate-x-0.5 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 shrink-0 mt-0.5" />
            </div>

            {/* Price table */}
            <div className="rounded-lg border border-[var(--border)]/40 overflow-hidden mb-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--surface)]/50">
                    <th className="text-left font-normal text-[var(--muted)] px-2.5 py-1.5">
                      {t("pricing.promptPrice", { defaultValue: "Input" })}
                    </th>
                    <th className="text-left font-normal text-[var(--muted)] px-2.5 py-1.5">
                      {t("pricing.completionPrice", { defaultValue: "Output" })}
                    </th>
                    {model.cache_ratio != null && model.cache_ratio !== 0 && (
                      <th className="text-left font-normal text-[var(--muted)] px-2.5 py-1.5">
                        {t("pricing.cachePrice", { defaultValue: "Cache" })}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono font-medium px-2.5 py-1.5">
                      {formatShortPrice(model.model_ratio)}
                    </td>
                    <td className="font-mono font-medium px-2.5 py-1.5">
                      {formatShortPrice(
                        model.model_ratio * model.completion_ratio
                      )}
                    </td>
                    {model.cache_ratio != null && model.cache_ratio !== 0 && (
                      <td className="font-mono font-medium px-2.5 py-1.5">
                        {formatShortPrice(
                          model.model_ratio * model.cache_ratio
                        )}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom row: modalities + capabilities */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {modalities.map((m) => {
                  const Icon = MODALITY_ICONS[m];
                  return Icon ? (
                    <span
                      key={m}
                      className="inline-flex items-center justify-center h-5 w-5 rounded bg-[var(--surface)]/50 text-[var(--muted)]"
                      title={m}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                  ) : null;
                })}
                {capabilities.length > 0 && (
                  <span className="flex -space-x-0.5 ml-1">
                    {capabilities.slice(0, 5).map((cap) => (
                      <span
                        key={cap}
                        className="inline-flex items-center justify-center h-5 min-w-[20px] rounded bg-[var(--accent)]/10 text-[8px] font-bold text-[var(--accent)] px-0.5"
                        title={cap}
                      >
                        {CAPABILITY_LABELS[cap] ?? cap.slice(0, 2).toUpperCase()}
                      </span>
                    ))}
                    {capabilities.length > 5 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded bg-[var(--muted)]/10 text-[8px] font-bold text-[var(--muted)] px-1">
                        +{capabilities.length - 5}
                      </span>
                    )}
                  </span>
                )}
              </div>
              {model.enable_groups && model.enable_groups.length > 0 && (
                <span className="text-[10px] text-[var(--muted)]">
                  {model.enable_groups.length} group{model.enable_groups.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ──────────── Card Skeleton ──────────── */

function CardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="rounded-xl border border-[var(--border)]/60 overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="h-[3px] bg-[var(--surface)] animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)]/40 p-2 space-y-2">
          <div className="flex gap-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ──────────── Empty State ──────────── */

function EmptyState({
  hasFilters,
  onClear,
  t,
}: {
  hasFilters: boolean;
  onClear: () => void;
  t: (k: string, opts?: Record<string, string>) => string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
          <Cpu className="h-8 w-8 text-[var(--muted)]" />
        </div>
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
          <X className="h-3 w-3 text-[var(--accent)]" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
        {hasFilters
          ? t("pricing.noMatches", { defaultValue: "No matching models" })
          : t("common.noData")}
      </h3>
      <p className="text-sm text-[var(--muted)] mb-4 max-w-xs">
        {hasFilters
          ? t("pricing.noMatchesHint", {
              defaultValue:
                "Try adjusting your search or filters to find what you need.",
            })
          : t("pricing.noModelsHint", {
              defaultValue: "No models are currently available.",
            })}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>
          {t("pricing.clearFilters", { defaultValue: "Clear filters" })}
        </Button>
      )}
    </div>
  );
}

export { ModelDetailsPage } from "./model-details-page";
