"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Activity, TrendingUp, Coins, Cpu, Users } from "lucide-react";
import { getUserQuotaDataByUsers, getUserQuotaDates } from "./api";
import { coerceDashboardSection } from "./section-registry";

const sections = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "models", label: "Models", icon: Cpu },
  { key: "users", label: "Users", icon: Users, adminOnly: true },
];

export default function DashboardSectionPage({ section }: { section: string }) {
  const activeSection = coerceDashboardSection(section);
  const user = useAuthStore((s) => s.auth.user);
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("nav.dashboard")}</h1>

      <nav className="flex gap-1">
        {sections.filter((s) => !s.adminOnly || (user?.role ?? 0) >= 100).map((s) => (
          <Link
            key={s.key}
            href={`/dashboard/${s.key}`}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeSection === s.key
                ? "bg-[var(--surface)] text-[var(--foreground)]"
                : "text-[var(--muted)] hover:bg-[var(--surface)]/50"
            )}
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </Link>
        ))}
      </nav>

      {activeSection === "overview" && <DashboardOverview />}
      {activeSection === "models" && <DashboardModels />}
      {activeSection === "users" && <DashboardUsers />}
    </div>
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

  if (loading) return <Skeleton className="h-80 rounded-lg" />;

  const stats = [
    { label: t("dashboard.totalQuota"), value: user ? ((user.quota ?? 0) / 500000).toFixed(2) : "—", suffix: "$", icon: Coins },
    { label: t("dashboard.usedQuota"), value: user ? ((user.used_quota ?? 0) / 500000).toFixed(2) : "—", suffix: "$", icon: TrendingUp },
    { label: t("dashboard.requestCount"), value: user?.request_count?.toLocaleString() ?? "—", icon: Activity },
    { label: t("dashboard.remainingQuota"), value: user ? (((user.quota ?? 0) - (user.used_quota ?? 0)) / 500000).toFixed(2) : "—", suffix: "$", icon: Cpu },
  ];

  const chartData = (data?.data || []).map((d: any) => ({
    date: new Date(d.timestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    prompt: d.prompt_tokens ?? 0,
    completion: d.completion_tokens ?? 0,
  }));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-[var(--muted)]">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-[var(--muted)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{s.suffix}{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("dashboard.usageTrend")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="prompt" stackId="a" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completion" stackId="a" fill="var(--accent-muted)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
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

  const COLORS = ["var(--accent)", "var(--success)", "var(--warning)", "var(--destructive)", "var(--accent-muted)"];

  if (loading) return <Skeleton className="h-80 rounded-lg" />;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Usage by Model</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted)]">{t("common.noData")}</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="var(--accent)"
                dataKey="count"
                nameKey="model_name"
              >
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
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

  if (loading) return <Skeleton className="h-80 rounded-lg" />;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Top Users</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted)]">{t("common.noData")}</div>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 20).map((u, i) => (
              <div key={u.username || i} className="flex items-center justify-between p-3 rounded-md bg-[var(--surface)]/30">
                <div>
                  <div className="font-medium text-sm">{u.username}</div>
                  <div className="text-xs text-[var(--muted)]">{u.request_count?.toLocaleString() ?? 0} requests</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">${((u.used_quota ?? 0) / 500000).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
