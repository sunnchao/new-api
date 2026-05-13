"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatQuota } from "@/lib/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Activity, Coins, Cpu, TrendingUp, BarChart3,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { getUserQuotaDates } from "./api";

interface DashboardData {
  total_quota?: number;
  used_quota?: number;
  request_count?: number;
  data?: Array<{ timestamp: number; prompt_tokens: number; completion_tokens: number; request_count: number }>;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.auth.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserQuotaDates().then((res) => {
      if (res.data) setData(res.data as DashboardData);
    }).finally(() => setLoading(false));
  }, []);

  const quotaUsed = user ? (user.used_quota / Math.max(user.quota, 1)) * 100 : 0;

  const chartData = (data?.data || []).map((d) => ({
    date: new Date(d.timestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    prompt: d.prompt_tokens,
    completion: d.completion_tokens,
    requests: d.request_count,
  }));

  const statCards = [
    {
      label: t("dashboard.totalQuota"),
      value: user?.quota ? (user.quota / 500000).toFixed(2) : "0",
      icon: Coins,
      suffix: "$",
    },
    {
      label: t("dashboard.usedQuota"),
      value: user?.used_quota ? (user.used_quota / 500000).toFixed(2) : "0",
      icon: TrendingUp,
      suffix: "$",
    },
    {
      label: t("dashboard.requestCount"),
      value: user?.request_count?.toLocaleString() ?? "0",
      icon: Activity,
    },
    {
      label: t("dashboard.remainingQuota"),
      value: user ? ((user.quota - user.used_quota) / 500000).toFixed(2) : "0",
      icon: Cpu,
      suffix: "$",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.overview")}</h1>
          <p className="text-sm text-[var(--muted)]">
            {t("dashboard.overviewDescription", { defaultValue: "Monitor your API usage, costs, and performance in real time." })}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[108px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[360px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.overview")}</h1>
        <p className="text-sm text-[var(--muted)]">
          {t("dashboard.overviewDescription", { defaultValue: "Monitor your API usage, costs, and performance in real time." })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                {stat.label}
              </CardTitle>
              <div className="rounded-md bg-[var(--accent)]/10 p-1.5">
                <stat.icon className="h-4 w-4 text-[var(--accent)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                {stat.suffix && <span className="text-sm font-medium text-[var(--muted)]">{stat.suffix}</span>}
                <span className="text-2xl font-bold tracking-tight font-mono">{stat.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quota bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t("dashboard.usedQuota")}</span>
            <span className="text-sm font-mono text-[var(--muted)]">{quotaUsed.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[var(--surface)] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                quotaUsed > 90
                  ? "bg-red-500"
                  : quotaUsed > 70
                    ? "bg-amber-500"
                    : "bg-[var(--accent)]"
              )}
              style={{ width: `${Math.min(quotaUsed, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]">
            <span>{formatQuota(user?.used_quota ?? 0)} {t("common.used")}</span>
            <span>{formatQuota((user?.quota ?? 0) - (user?.used_quota ?? 0))} {t("common.remaining", { defaultValue: "remaining" })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Token usage chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
              <CardTitle className="text-base">{t("dashboard.usageTrend")}</CardTitle>
            </div>
            <Badge variant="outline" className="font-normal">
              {chartData.length} {t("common.days", { defaultValue: "days" })}
            </Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="promptGradMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="completionGradMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="prompt"
                  stackId="1"
                  stroke="var(--accent)"
                  fill="url(#promptGradMain)"
                  strokeWidth={2}
                  name="Prompt"
                />
                <Area
                  type="monotone"
                  dataKey="completion"
                  stackId="1"
                  stroke="#10b981"
                  fill="url(#completionGradMain)"
                  strokeWidth={2}
                  name="Completion"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
