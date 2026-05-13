"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { formatQuota } from "@/lib/format";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Activity, TrendingUp, Coins, Cpu, Users, BarChart3,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { getUserQuotaDataByUsers, getUserQuotaDates } from "./api";
import { coerceDashboardSection } from "./section-registry";

const sections = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "models", label: "Models", icon: Cpu },
  { key: "users", label: "Users", icon: Users, adminOnly: true },
];

const CHART_COLORS = [
  "var(--accent)",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export default function DashboardSectionPage({ section }: { section: string }) {
  const activeSection = coerceDashboardSection(section);
  const user = useAuthStore((s) => s.auth.user);
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
        <p className="text-sm text-[var(--muted)]">
          {t("dashboard.overviewDescription", { defaultValue: "Monitor your API usage, costs, and performance in real time." })}
        </p>
      </div>

      <nav className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)]/30 p-1">
        {sections.filter((s) => !s.adminOnly || (user?.role ?? 0) >= 100).map((s) => {
          const active = activeSection === s.key;
          return (
            <Link
              key={s.key}
              href={`/dashboard/${s.key}`}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <s.icon className={cn("h-4 w-4", active && "text-[var(--accent)]")} />
              {s.label}
            </Link>
          );
        })}
      </nav>

      {activeSection === "overview" && <DashboardOverview />}
      {activeSection === "models" && <DashboardModels />}
      {activeSection === "users" && <DashboardUsers />}
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          {label}
        </CardTitle>
        <div className="rounded-md bg-[var(--accent)]/10 p-1.5">
          <Icon className="h-4 w-4 text-[var(--accent)]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          {suffix && <span className="text-sm font-medium text-[var(--muted)]">{suffix}</span>}
          <span className="text-2xl font-bold tracking-tight font-mono">{value}</span>
        </div>
        {trend && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {trend.positive ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={trend.positive ? "text-emerald-500" : "text-red-500"}>
              {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardOverview() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.auth.user);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserQuotaDates().then((res) => {
      if (res.data) setData(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[108px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[360px] rounded-lg" />
      </div>
    );
  }

  const quotaUsed = user ? (user.quota ?? 0) : 0;
  const quotaTotal = user ? Math.max(user.quota ?? 1, 1) : 1;
  const quotaPercent = (quotaUsed / quotaTotal) * 100;

  const stats = [
    {
      label: t("dashboard.totalQuota"),
      value: ((user?.quota ?? 0) / 500000).toFixed(2),
      suffix: "$",
      icon: Coins,
    },
    {
      label: t("dashboard.usedQuota"),
      value: ((user?.used_quota ?? 0) / 500000).toFixed(2),
      suffix: "$",
      icon: TrendingUp,
    },
    {
      label: t("dashboard.requestCount"),
      value: user?.request_count?.toLocaleString() ?? "0",
      icon: Activity,
    },
    {
      label: t("dashboard.remainingQuota"),
      value: (((user?.quota ?? 0) - (user?.used_quota ?? 0)) / 500000).toFixed(2),
      suffix: "$",
      icon: Cpu,
    },
  ];

  const chartData = (data?.data || []).map((d: any) => ({
    date: new Date(d.timestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    prompt: d.prompt_tokens ?? 0,
    completion: d.completion_tokens ?? 0,
    requests: d.request_count ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Quota progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t("dashboard.usedQuota")}</span>
            <span className="text-sm font-mono text-[var(--muted)]">
              {quotaPercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[var(--surface)] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                quotaPercent > 90
                  ? "bg-red-500"
                  : quotaPercent > 70
                    ? "bg-amber-500"
                    : "bg-[var(--accent)]"
              )}
              style={{ width: `${Math.min(quotaPercent, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]">
            <span>{formatQuota(user?.used_quota ?? 0)} {t("common.used")}</span>
            <span>{formatQuota((user?.quota ?? 0) - (user?.used_quota ?? 0))} {t("common.remaining", { defaultValue: "remaining" })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Usage trend chart */}
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
                  <linearGradient id="promptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#promptGrad)"
                  strokeWidth={2}
                  name="Prompt"
                />
                <Area
                  type="monotone"
                  dataKey="completion"
                  stackId="1"
                  stroke="#10b981"
                  fill="url(#completionGrad)"
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

function DashboardModels() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserQuotaDates().then((res) => {
      const models = Array.isArray(res.data)
        ? res.data
        : (res.data as { models?: unknown[] } | undefined)?.models;
      if (Array.isArray(models)) setData(models);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[360px] rounded-lg" />
        <Skeleton className="h-[360px] rounded-lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <EmptyState
            icon={<Cpu className="h-5 w-5" />}
            title={t("common.noData")}
            description={t("dashboard.noModelData", { defaultValue: "No model usage data available yet." })}
          />
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum: number, d: any) => sum + (d.count ?? 0), 0);
  const topModels = data.slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[var(--accent)]" />
            <CardTitle className="text-base">Usage Distribution</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topModels}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="count"
                nameKey="model_name"
                strokeWidth={0}
              >
                {topModels.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topModels.map((m: any, i: number) => {
              const pct = total > 0 ? ((m.count ?? 0) / total) * 100 : 0;
              return (
                <div key={m.model_name || i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="font-mono text-xs truncate">{m.model_name}</span>
                    </div>
                    <span className="text-xs text-[var(--muted)] shrink-0">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardUsers() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserQuotaDataByUsers().then((res) => {
      if (res.data) setData(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-[400px] rounded-lg" />;

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title={t("common.noData")}
            description={t("dashboard.noUserData", { defaultValue: "No user usage data available yet." })}
          />
        </CardContent>
      </Card>
    );
  }

  const maxQuota = Math.max(...data.slice(0, 20).map((u) => u.used_quota ?? 0), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--accent)]" />
          <CardTitle className="text-base">Top Users</CardTitle>
        </div>
        <Badge variant="outline">{data.length} {t("common.users", { defaultValue: "users" })}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.slice(0, 20).map((u, i) => {
            const quota = u.used_quota ?? 0;
            const pct = (quota / maxQuota) * 100;
            return (
              <div
                key={u.username || i}
                className="group flex items-center gap-4 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--surface)]/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-bold text-[var(--muted)]">
                  {i < 3 ? (
                    <span className={cn(
                      "text-sm",
                      i === 0 && "text-amber-500",
                      i === 1 && "text-zinc-400",
                      i === 2 && "text-amber-700",
                    )}>
                      {["🥇", "🥈", "🥉"][i]}
                    </span>
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{u.username}</span>
                    <span className="font-mono text-sm shrink-0">${(quota / 500000).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-[var(--surface)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--muted)] shrink-0">
                      {u.request_count?.toLocaleString() ?? 0} req
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
