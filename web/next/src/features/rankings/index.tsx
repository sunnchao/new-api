"use client";

import { PublicLayout } from "@/components/layout/public-layout";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useUrlState } from "@/lib/url-state";
import { getRankings } from "./api";
import type { RankingPeriod, RankingsSnapshot, ModelRanking, VendorRanking, RankingMover } from "./types";

const VALID_PERIODS: RankingPeriod[] = ["today", "week", "month", "year", "all"];

export function RankingsPage() {
  const { t } = useTranslation();
  const { searchParams, setParam } = useUrlState();
  const rawPeriod = searchParams.get("period") as RankingPeriod | null;
  const period = rawPeriod && VALID_PERIODS.includes(rawPeriod) ? rawPeriod : "week";
  const [snapshot, setSnapshot] = useState<RankingsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getRankings(period).then((res) => {
      if (res.success && res.data) setSnapshot(res.data);
      else setError(res.message || "Failed to load");
    }).catch((e) => setError(e.message || "Error")).finally(() => setLoading(false));
  }, [period]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">{t("rankings.title", { defaultValue: "Model Rankings" })}</h1>
          <p className="text-[var(--muted)]">{t("rankings.description", { defaultValue: "See which models are most popular" })}</p>
        </div>

        <Tabs value={period} onValueChange={(v) => setParam("period", v)} className="mb-8">
          <TabsList className="mx-auto">
            {VALID_PERIODS.map((p) => (
              <TabsTrigger key={p} value={p}>{t(`rankings.period.${p}`, { defaultValue: p })}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        ) : error ? (
          <Card className="border-dashed"><CardContent className="text-center py-12 text-[var(--muted)]">{error}</CardContent></Card>
        ) : snapshot ? (
          <div className="space-y-8">
            <ModelsSection models={snapshot.models} />
            <VendorsSection vendors={snapshot.vendors} />
            <MoversSection movers={snapshot.top_movers} droppers={snapshot.top_droppers} />
          </div>
        ) : null}
      </div>
    </PublicLayout>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Trophy className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Trophy className="h-4 w-4 text-amber-600" />;
  return <span className="text-sm font-mono text-[var(--muted)]">{rank}</span>;
}

function RankChange({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) return <Badge variant="outline" className="text-[10px]">NEW</Badge>;
  const delta = previous - current;
  if (delta === 0) return <Minus className="h-3 w-3 text-[var(--muted)]" />;
  if (delta > 0) return <span className="flex items-center text-xs text-green-600"><ArrowUp className="h-3 w-3" />{delta}</span>;
  return <span className="flex items-center text-xs text-red-500"><ArrowDown className="h-3 w-3" />{Math.abs(delta)}</span>;
}

function ModelsSection({ models }: { models: ModelRanking[] }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("rankings.topModels", { defaultValue: "Top Models" })}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>{t("rankings.model", { defaultValue: "Model" })}</TableHead>
              <TableHead>{t("rankings.vendor", { defaultValue: "Vendor" })}</TableHead>
              <TableHead className="text-right">{t("rankings.tokens", { defaultValue: "Tokens" })}</TableHead>
              <TableHead className="text-right">{t("rankings.share", { defaultValue: "Share" })}</TableHead>
              <TableHead className="text-right">{t("rankings.growth", { defaultValue: "Growth" })}</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.slice(0, 20).map((m) => (
              <TableRow key={m.model_name}>
                <TableCell><RankBadge rank={m.rank} /></TableCell>
                <TableCell className="font-mono text-sm font-medium">{m.model_name}</TableCell>
                <TableCell className="text-sm text-[var(--muted)]">{m.vendor}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatTokens(m.total_tokens)}</TableCell>
                <TableCell className="text-right text-sm">{(m.share * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right"><GrowthBadge pct={m.growth_pct} /></TableCell>
                <TableCell><RankChange current={m.rank} previous={m.previous_rank} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function VendorsSection({ vendors }: { vendors: VendorRanking[] }) {
  const { t } = useTranslation();
  if (!vendors || vendors.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("rankings.topVendors", { defaultValue: "Top Vendors" })}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>{t("rankings.vendor", { defaultValue: "Vendor" })}</TableHead>
              <TableHead className="text-right">{t("rankings.models", { defaultValue: "Models" })}</TableHead>
              <TableHead className="text-right">{t("rankings.tokens", { defaultValue: "Tokens" })}</TableHead>
              <TableHead className="text-right">{t("rankings.share", { defaultValue: "Share" })}</TableHead>
              <TableHead className="text-right">{t("rankings.growth", { defaultValue: "Growth" })}</TableHead>
              <TableHead>{t("rankings.topModel", { defaultValue: "Top Model" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((v) => (
              <TableRow key={v.vendor}>
                <TableCell><RankBadge rank={v.rank} /></TableCell>
                <TableCell className="font-medium">{v.vendor}</TableCell>
                <TableCell className="text-right font-mono text-sm">{v.models_count}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatTokens(v.total_tokens)}</TableCell>
                <TableCell className="text-right text-sm">{(v.share * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right"><GrowthBadge pct={v.growth_pct} /></TableCell>
                <TableCell className="font-mono text-xs text-[var(--muted)]">{v.top_model}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function MoversSection({ movers, droppers }: { movers: RankingMover[]; droppers: RankingMover[] }) {
  const { t } = useTranslation();
  if ((!movers || movers.length === 0) && (!droppers || droppers.length === 0)) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {movers && movers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              {t("rankings.topMovers", { defaultValue: "Top Movers" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {movers.slice(0, 5).map((m) => (
              <div key={m.model_name} className="flex items-center justify-between p-2 rounded bg-[var(--surface)]/50">
                <div>
                  <div className="font-mono text-sm font-medium">{m.model_name}</div>
                  <div className="text-xs text-[var(--muted)]">{m.vendor} · Rank #{m.current_rank}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <ArrowUp className="h-3 w-3" />+{m.rank_delta}
                  </div>
                  <div className="text-xs text-[var(--muted)]">+{m.growth_pct.toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {droppers && droppers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              {t("rankings.topDroppers", { defaultValue: "Top Droppers" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {droppers.slice(0, 5).map((m) => (
              <div key={m.model_name} className="flex items-center justify-between p-2 rounded bg-[var(--surface)]/50">
                <div>
                  <div className="font-mono text-sm font-medium">{m.model_name}</div>
                  <div className="text-xs text-[var(--muted)]">{m.vendor} · Rank #{m.current_rank}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-red-500 text-sm font-medium">
                    <ArrowDown className="h-3 w-3" />{m.rank_delta}
                  </div>
                  <div className="text-xs text-[var(--muted)]">{m.growth_pct.toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GrowthBadge({ pct }: { pct: number }) {
  if (pct === 0) return <span className="text-xs text-[var(--muted)]">—</span>;
  const positive = pct > 0;
  return (
    <span className={`text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>
      {positive ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

function formatTokens(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
