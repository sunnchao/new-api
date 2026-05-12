"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  Sparkles,
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CheckinRecord {
  checkin_date: string;
  quota_awarded?: number;
}

interface CheckinStats {
  checked_in_today?: boolean;
  last_checkin_time?: number;
  current_streak?: number;
  max_streak?: number;
  total_checkins?: number;
  records?: CheckinRecord[];
}

interface CheckinResponse {
  stats?: CheckinStats;
  // some backends return flat fields
  checked_in_today?: boolean;
  last_checkin_time?: number;
  current_streak?: number;
  records?: CheckinRecord[];
}

export function CheckinTab() {
  const { t } = useTranslation();
  const [data, setData] = useState<CheckinResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/user/checkin");
      if (res.data?.success) {
        setData(res.data.data || {});
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const stats: CheckinStats = useMemo(() => {
    if (!data) return {};
    return {
      ...(data.stats || {}),
      checked_in_today: data.stats?.checked_in_today ?? data.checked_in_today,
      last_checkin_time:
        data.stats?.last_checkin_time ?? data.last_checkin_time,
      current_streak: data.stats?.current_streak ?? data.current_streak,
      records: data.stats?.records ?? data.records ?? [],
    };
  }, [data]);

  const checkedToday = !!stats.checked_in_today;

  const handleCheckin = async () => {
    if (checkedToday) return;
    setChecking(true);
    try {
      const res = await api.post("/api/user/checkin");
      if (res.data?.success) {
        const award = res.data.data?.quota_awarded;
        toast.success(
          award
            ? t("Check-in successful! Received {{q}}", { q: award })
            : t("Check-in successful")
        );
        fetchStatus();
      } else {
        toast.error(res.data?.message || t("Check-in failed"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("Check-in failed"));
    } finally {
      setChecking(false);
    }
  };

  // ─── Calendar (7x5 grid = 35 cells) ───
  const now = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const monthLabel = useMemo(() => {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, [now]);

  const recordMap = useMemo(() => {
    const map: Record<string, number | true> = {};
    (stats.records || []).forEach((r) => {
      map[r.checkin_date] = r.quota_awarded ?? true;
    });
    return map;
  }, [stats.records]);

  const cells = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = firstDay.getDay(); // Sunday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const items: Array<{
      key: string;
      day: number | null;
      inMonth: boolean;
      dateStr: string;
      isToday: boolean;
      checked: boolean;
      quota?: number;
    }> = [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    for (let i = 0; i < 35; i++) {
      const dayNum = i - start + 1;
      const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
      const dateStr = inMonth
        ? `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
        : "";
      const rec = inMonth ? recordMap[dateStr] : undefined;
      items.push({
        key: `${i}`,
        day: inMonth ? dayNum : null,
        inMonth,
        dateStr,
        isToday: inMonth && dateStr === todayStr,
        checked: rec !== undefined,
        quota: typeof rec === "number" ? rec : undefined,
      });
    }
    return items;
  }, [now, recordMap]);

  const weekdays = useMemo(
    () => [
      t("Su"),
      t("Mo"),
      t("Tu"),
      t("We"),
      t("Th"),
      t("Fr"),
      t("Sa"),
    ],
    [t]
  );

  const lastCheckinLabel = useMemo(() => {
    if (!stats.last_checkin_time) return "-";
    const d = new Date(stats.last_checkin_time * 1000);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
  }, [stats.last_checkin_time]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
            {t("Daily Check-in")}
            {checkedToday && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-[var(--success)]/15 px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                <Sparkles className="h-3 w-3" />
                {t("Checked in")}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">
              {checkedToday
                ? t("You've already checked in today. See you tomorrow.")
                : t("Check in daily to receive rewards and build your streak.")}
            </p>
            <Button
              onClick={handleCheckin}
              disabled={checkedToday || checking || loading}
            >
              {checking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {checkedToday ? t("Checked in") : t("Check in now")}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-[var(--border)]">
            <div className="bg-[var(--surface)]/40 p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-semibold tabular-nums">
                <Flame className="h-5 w-5 text-[var(--warning)]" />
                {stats.current_streak ?? 0}
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                {t("Current streak")}
              </div>
            </div>
            <div className="bg-[var(--surface)]/40 p-4 text-center">
              <div className="text-2xl font-semibold tabular-nums">
                {stats.total_checkins ?? 0}
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                {t("Total check-ins")}
              </div>
            </div>
            <div className="bg-[var(--surface)]/40 p-4 text-center">
              <div className="truncate text-sm font-medium">
                {lastCheckinLabel}
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                {t("Last check-in")}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{monthLabel}</h4>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMonthOffset((v) => v - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMonthOffset((v) => v + 1)}
                  disabled={monthOffset >= 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekdays.map((d) => (
                <div
                  key={d}
                  className="flex h-7 items-center justify-center text-[10px] font-medium text-[var(--muted)]"
                >
                  {d}
                </div>
              ))}
              {cells.map((c) => (
                <div
                  key={c.key}
                  title={
                    c.checked && c.quota
                      ? `${c.dateStr} +${c.quota}`
                      : c.dateStr
                  }
                  className={cn(
                    "relative flex h-10 items-center justify-center rounded-md border text-sm tabular-nums transition-colors",
                    c.inMonth
                      ? "border-[var(--border)]"
                      : "border-transparent text-[var(--muted)]/40",
                    c.isToday && "ring-1 ring-[var(--accent)]",
                    c.checked &&
                      "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                  )}
                >
                  <span>{c.day ?? ""}</span>
                  {c.checked && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[var(--success)]" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-[var(--muted)]">
              {t("You can only check in once per day.")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
