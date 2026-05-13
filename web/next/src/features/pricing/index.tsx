"use client";

import { PublicLayout } from "@/components/layout/public-layout";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Cpu, ArrowUpRight } from "lucide-react";
import { getPricing } from "./api";
import type { PricingData, PricingModel, PricingVendor } from "./types";

type SortOption = "name" | "price-low" | "price-high";

export function PricingPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [quotaFilter, setQuotaFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("name");

  useEffect(() => {
    getPricing().then((res) => {
      if (res) setData(res);
    }).finally(() => setLoading(false));
  }, []);

  const models = data?.data ?? [];
  const vendors = data?.vendors ?? [];

  const filtered = useMemo(() => {
    let list = models.filter((m) => {
      if (search && !m.model_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (vendorFilter !== "all" && m.vendor_name !== vendorFilter) return false;
      if (quotaFilter === "token" && m.quota_type !== 0) return false;
      if (quotaFilter === "request" && m.quota_type !== 1) return false;
      return true;
    });
    if (sort === "name") list.sort((a, b) => a.model_name.localeCompare(b.model_name));
    else if (sort === "price-low") list.sort((a, b) => a.model_ratio - b.model_ratio);
    else if (sort === "price-high") list.sort((a, b) => b.model_ratio - a.model_ratio);
    return list;
  }, [models, search, vendorFilter, quotaFilter, sort]);

  const formatPrice = (ratio: number) => {
    if (ratio === 0) return "Free";
    return `$${((ratio * 2) / 1000000).toFixed(4)}/1M`;
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 border-[var(--accent-muted)] text-[var(--accent)]">
            <Cpu className="h-3 w-3 mr-1" />
            {filtered.length} {t("pricing.models", { defaultValue: "Models" })}
          </Badge>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">{t("pricing.title")}</h1>
          <p className="text-[var(--muted)] max-w-xl mx-auto">{t("pricing.allModelsDescription")}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
            <Input placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          {vendors.length > 0 && (
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("pricing.allVendors", { defaultValue: "All Vendors" })}</SelectItem>
                {vendors.map((v) => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Tabs value={quotaFilter} onValueChange={setQuotaFilter}>
            <TabsList>
              <TabsTrigger value="all">{t("pricing.allTypes", { defaultValue: "All" })}</TabsTrigger>
              <TabsTrigger value="token">{t("pricing.tokenBased", { defaultValue: "Token" })}</TabsTrigger>
              <TabsTrigger value="request">{t("pricing.perRequest", { defaultValue: "Request" })}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t("pricing.sortName", { defaultValue: "Name" })}</SelectItem>
              <SelectItem value="price-low">{t("pricing.sortPriceLow", { defaultValue: "Price: Low" })}</SelectItem>
              <SelectItem value="price-high">{t("pricing.sortPriceHigh", { defaultValue: "Price: High" })}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((model) => (
              <ModelCard key={model.model_name} model={model} formatPrice={formatPrice} t={t} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-[var(--muted)]">
                <Cpu className="h-8 w-8 mx-auto mb-3 opacity-50" />
                {t("common.noData")}
              </div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

function ModelCard({ model, formatPrice, t }: { model: PricingModel; formatPrice: (r: number) => string; t: (k: string, opts?: Record<string, string>) => string }) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:border-[var(--accent-muted)] hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-sm font-semibold truncate">{model.model_name}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {model.vendor_name && <Badge variant="secondary" className="text-[10px] font-normal">{model.vendor_name}</Badge>}
              {model.quota_type === 1 && <Badge variant="outline" className="text-[10px]">Per Request</Badge>}
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <PriceCell label={t("pricing.promptPrice", { defaultValue: "Input" })} value={formatPrice(model.model_ratio)} />
          <PriceCell label={t("pricing.completionPrice", { defaultValue: "Output" })} value={formatPrice(model.model_ratio * model.completion_ratio)} />
          {model.cache_ratio != null && model.cache_ratio !== 0 && (
            <PriceCell label={t("pricing.cachePrice", { defaultValue: "Cache" })} value={formatPrice(model.model_ratio * model.cache_ratio)} />
          )}
        </div>
        {model.tags && (
          <div className="flex flex-wrap gap-1 mt-3">
            {model.tags.split(",").slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] font-normal">{tag.trim()}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PriceCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[var(--surface)]/50 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

export { ModelDetailsPage } from "./model-details-page";
