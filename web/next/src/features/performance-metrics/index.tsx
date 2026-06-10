"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Clock, Gauge, RefreshCw, Zap } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { getPerfMetricsSummary } from "./api";
import {
  formatLatency,
  formatThroughput,
  formatUptimePct,
} from "./lib/format";
import type { PerfModelSummary } from "./types";

function average(
  rows: PerfModelSummary[],
  pick: (row: PerfModelSummary) => number,
  isValid: (value: number) => boolean = Number.isFinite
) {
  let total = 0;
  let count = 0;
  for (const row of rows) {
    const value = Number(pick(row));
    if (!isValid(value)) continue;
    total += value;
    count += 1;
  }
  return count > 0 ? total / count : Number.NaN;
}

export default function PerformanceMetricsPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<PerfModelSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const summaryRes = await getPerfMetricsSummary().catch(() => null);
      setEntries(summaryRes?.data?.models ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summary = useMemo(
    () => ({
      modelCount: entries.length,
      avgLatencyMs: average(
        entries,
        (entry) => entry.avg_latency_ms,
        (value) => Number.isFinite(value) && value > 0
      ),
      successRate: average(entries, (entry) => entry.success_rate),
      avgTps: average(
        entries,
        (entry) => entry.avg_tps,
        (value) => Number.isFinite(value) && value > 0
      ),
    }),
    [entries]
  );

  const chartData = entries
    .slice(0, 10)
    .map((e) => ({
      model:
        e.model_name.length > 20
          ? e.model_name.slice(0, 17) + "..."
          : e.model_name,
      latency: Math.round(e.avg_latency_ms),
      success: Math.round(e.success_rate * 100) / 100,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gauge className="h-6 w-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold">Performance Metrics</h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("common.refresh")}
        </Button>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-lg" />
        </>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--muted)]">
                  Monitored Models
                </CardTitle>
                <Activity className="h-4 w-4 text-[var(--muted)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {summary.modelCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--muted)]">
                  Avg Latency
                </CardTitle>
                <Clock className="h-4 w-4 text-[var(--muted)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {formatLatency(summary.avgLatencyMs)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--muted)]">
                  Success Rate
                </CardTitle>
                <Zap className="h-4 w-4 text-[var(--muted)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {formatUptimePct(summary.successRate)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--muted)]">
                  Throughput
                </CardTitle>
                <Gauge className="h-4 w-4 text-[var(--muted)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {formatThroughput(summary.avgTps)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latency by Model</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="model"
                      tick={{ fontSize: 10, fill: "var(--muted)" }}
                      angle={-30}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--muted)" }}
                      label={{ value: "ms", angle: -90, position: "insideLeft", fill: "var(--muted)", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="latency" fill="var(--accent)" name="Avg latency" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model Performance Detail</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Avg Latency</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Tokens/s</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-[var(--muted)]"
                      >
                        {t("common.noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((e) => (
                      <TableRow key={e.model_name}>
                        <TableCell className="font-mono text-xs">{e.model_name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatLatency(e.avg_latency_ms)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatUptimePct(e.success_rate)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {e.request_count?.toLocaleString() ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatThroughput(e.avg_tps)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
