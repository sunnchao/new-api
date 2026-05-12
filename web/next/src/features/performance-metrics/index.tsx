"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { getPerfMetrics, getPerfMetricsSummary } from "./api";

interface PerfSummary {
  total_requests: number;
  avg_latency: number;
  p50_latency: number;
  p95_latency: number;
  p99_latency: number;
  error_rate: number;
  throughput: number;
}

interface PerfEntry {
  model: string;
  avg_latency: number;
  p95_latency: number;
  request_count: number;
  error_count: number;
  tokens_per_second?: number;
}

export default function PerformanceMetricsPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<PerfSummary | null>(null);
  const [entries, setEntries] = useState<PerfEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, metricsRes] = await Promise.all([
        getPerfMetricsSummary().catch(() => ({ data: null })),
        getPerfMetrics().catch(() => ({ data: [] })),
      ]);
      if (summaryRes.data) setSummary(summaryRes.data as unknown as PerfSummary);
      if (Array.isArray(metricsRes.data)) setEntries(metricsRes.data as unknown as PerfEntry[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fmt = (n?: number) =>
    n == null ? "—" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toFixed(0);
  const fmtMs = (n?: number) => (n == null ? "—" : n.toFixed(0) + "ms");
  const fmtPct = (n?: number) => (n == null ? "—" : (n * 100).toFixed(2) + "%");

  const chartData = entries
    .slice(0, 10)
    .map((e) => ({
      model: e.model.length > 20 ? e.model.slice(0, 17) + "..." : e.model,
      avg: Math.round(e.avg_latency),
      p95: Math.round(e.p95_latency),
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
                  Total Requests
                </CardTitle>
                <Activity className="h-4 w-4 text-[var(--muted)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {fmt(summary?.total_requests)}
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
                  {fmtMs(summary?.avg_latency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--muted)]">
                  P95 Latency
                </CardTitle>
                <Zap className="h-4 w-4 text-[var(--muted)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {fmtMs(summary?.p95_latency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--muted)]">
                  Error Rate
                </CardTitle>
                <Activity className="h-4 w-4 text-[var(--muted)]" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold font-mono ${
                    (summary?.error_rate ?? 0) > 0.05
                      ? "text-[var(--destructive)]"
                      : ""
                  }`}
                >
                  {fmtPct(summary?.error_rate)}
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
                    <Bar dataKey="avg" fill="var(--accent)" name="Avg" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="p95" fill="var(--warning)" name="P95" radius={[4, 4, 0, 0]} />
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
                    <TableHead>P95</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead>Tokens/s</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-[var(--muted)]"
                      >
                        {t("common.noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((e) => (
                      <TableRow key={e.model}>
                        <TableCell className="font-mono text-xs">{e.model}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {fmtMs(e.avg_latency)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {fmtMs(e.p95_latency)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {e.request_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {e.error_count > 0 ? (
                            <Badge variant="destructive" className="font-mono">
                              {e.error_count}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="font-mono">0</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {e.tokens_per_second?.toFixed(1) ?? "—"}
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
