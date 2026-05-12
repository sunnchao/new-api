"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Activity, Coins, Cpu, TrendingUp } from "lucide-react";
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
      value: user?.quota ? (user.quota / 500000).toFixed(2) : "—",
      icon: Coins,
      suffix: "$",
    },
    {
      label: t("dashboard.usedQuota"),
      value: user?.used_quota ? (user.used_quota / 500000).toFixed(2) : "—",
      icon: TrendingUp,
      suffix: "$",
    },
    {
      label: t("dashboard.requestCount"),
      value: user?.request_count?.toLocaleString() ?? "—",
      icon: Activity,
    },
    {
      label: t("dashboard.remainingQuota"),
      value: user ? ((user.quota - user.used_quota) / 500000).toFixed(2) : "—",
      icon: Cpu,
      suffix: "$",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("dashboard.overview")}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.overview")}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted)]">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-[var(--muted)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {stat.suffix}{stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quota bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t("dashboard.usedQuota")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-[var(--surface)] rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(quotaUsed, 100)}%` }}
            />
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">{quotaUsed.toFixed(1)}% used</p>
        </CardContent>
      </Card>

      {/* Token usage chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("dashboard.usageTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="prompt" stackId="a" fill="var(--accent)" name="Prompt" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completion" stackId="a" fill="var(--accent-muted)" name="Completion" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
