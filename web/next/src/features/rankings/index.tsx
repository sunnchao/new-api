"use client";

import { PublicLayout } from "@/components/layout/public-layout";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import { useUrlState } from "@/lib/url-state";
import { getRankings } from "./api";
import type { RankingEntry, RankingPeriod, RankingsResponse } from "./types";

const VALID_PERIODS: RankingPeriod[] = ["today", "week", "month", "year", "all"];

function normalizeRankings(response: RankingsResponse): RankingEntry[] {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  return (payload?.models || []).map((model) => ({
    model_name: model.model_name,
    request_count: model.request_count ?? 0,
    token_count: model.total_tokens ?? 0,
  }));
}

export function RankingsPage() {
  const { t } = useTranslation();
  const { searchParams, setParam } = useUrlState();
  const rawPeriod = searchParams.get("period") as RankingPeriod | null;
  const period = rawPeriod && VALID_PERIODS.includes(rawPeriod) ? rawPeriod : "week";
  const [data, setData] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRankings(period).then((res) => {
      setData(normalizeRankings(res));
    }).finally(() => setLoading(false));
  }, [period]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">{t("rankings.title")}</h1>
          <p className="text-[var(--muted)]">{t("rankings.description")}</p>
        </div>

        <Tabs value={period} onValueChange={(value) => setParam("period", value)} className="mb-6">
          <TabsList>
            {VALID_PERIODS.map((item) => (
              <TabsTrigger key={item} value={item}>
                {t(`rankings.period.${item}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((entry, index) => (
              <Card key={entry.model_name} className="transition-colors hover:bg-[var(--surface)]/50">
                <CardContent className="flex items-center gap-4 py-3 px-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-bold">
                    {index < 3 ? (
                      <Trophy className={`h-4 w-4 ${index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-600"}`} />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm font-medium truncate block">{entry.model_name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-[var(--muted)]">
                    <div className="text-right">
                      <div className="font-medium text-[var(--foreground)]">{entry.request_count.toLocaleString()}</div>
                      <div>{t("rankings.requests")}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-[var(--foreground)]">{(entry.token_count / 1e6).toFixed(1)}M</div>
                      <div>{t("rankings.tokens")}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {data.length === 0 && (
              <div className="text-center py-12 text-[var(--muted)]">{t("common.noData")}</div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
