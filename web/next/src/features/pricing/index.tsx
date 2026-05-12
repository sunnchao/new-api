"use client";

import { PublicLayout } from "@/components/layout/public-layout";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { getPricing } from "./api";
import type { PricingModel } from "./types";

export function PricingPage() {
  const { t } = useTranslation();
  const [models, setModels] = useState<PricingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  useEffect(() => {
    getPricing().then((res) => {
      if (res.data) setModels(res.data);
    }).finally(() => setLoading(false));
  }, []);

  const groups = ["all", ...new Set(models.map((m) => m.group || "default"))];
  const filtered = models.filter((m) => {
    const matchSearch = !search || m.model_name.toLowerCase().includes(search.toLowerCase());
    const matchGroup = groupFilter === "all" || (m.group || "default") === groupFilter;
    return matchSearch && matchGroup;
  });

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">{t("pricing.title")}</h1>
          <p className="text-[var(--muted)]">{t("pricing.allModelsDescription")}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
            <Input
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {groups.length > 2 && (
            <Tabs value={groupFilter} onValueChange={setGroupFilter}>
              <TabsList>
                {groups.map((g) => (
                  <TabsTrigger key={g} value={g} className="capitalize">
                    {g}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((model) => (
              <Card key={model.model_name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono truncate">{model.model_name}</CardTitle>
                    {model.group && (
                      <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                        {model.group}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[var(--muted)]">{t("pricing.promptPrice")}</span>
                      <div className="font-mono font-medium">{model.prompt_ratio ?? "—"}</div>
                    </div>
                    <div>
                      <span className="text-[var(--muted)]">{t("pricing.completionPrice")}</span>
                      <div className="font-mono font-medium">{model.completion_ratio ?? "—"}</div>
                    </div>
                    {model.cache_ratio != null && model.cache_ratio !== 0 && (
                      <div>
                        <span className="text-[var(--muted)]">{t("pricing.cachePrice")}</span>
                        <div className="font-mono font-medium">{model.cache_ratio}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-[var(--muted)]">{t("common.noData")}</div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

export { ModelDetailsPage } from "./model-details-page";
