"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertCircle,
  Brush,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  Workflow,
} from "lucide-react";
import { useAuthStore, ROLE } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { formatQuota } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  getAllLogs,
  getAllMidjourneyLogs,
  getAllTaskLogs,
  getLogStats,
  getUserInfo,
  getUserLogs,
  getUserLogStats,
  getUserMidjourneyLogs,
  getUserTaskLogs,
} from "./api";
import {
  DEFAULT_COMMON_FILTERS,
  DEFAULT_TASK_FILTERS,
  LOG_CATEGORY_IDS,
  LOG_CATEGORY_META,
  LOG_TYPES,
  PAGE_SIZE,
} from "./constants";
import {
  buildCommonLogParams,
  buildTaskLikeParams,
  coerceUsageLogsSection,
  formatCount,
  formatDuration,
  formatUnixMilliseconds,
  formatUnixSeconds,
  getLogTypeConfig,
  getProgressValue,
  getTaskActionConfig,
  getTaskStatusConfig,
  truncateMiddle,
} from "./lib";
import type {
  CommonLogFilters,
  LogCategory,
  LogStatistics,
  MidjourneyLog,
  TaskLikeFilters,
  TaskLog,
  UsageLog,
  UserInfo,
} from "./types";

type LogItem = UsageLog | MidjourneyLog | TaskLog;

function toDateTimeLocal(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function getTodayFilters() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 0);

  return {
    startTime: toDateTimeLocal(start),
    endTime: toDateTimeLocal(end),
  };
}

function createCommonFilters(): CommonLogFilters {
  return {
    ...DEFAULT_COMMON_FILTERS,
    ...getTodayFilters(),
  };
}

function createTaskFilters(): TaskLikeFilters {
  return {
    ...DEFAULT_TASK_FILTERS,
    ...getTodayFilters(),
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function hasCommonFilters(filters: CommonLogFilters) {
  return (
    filters.type !== "all" ||
    Boolean(filters.model) ||
    Boolean(filters.token) ||
    Boolean(filters.group) ||
    Boolean(filters.username) ||
    Boolean(filters.channel) ||
    Boolean(filters.requestId)
  );
}

function hasTaskFilters(filters: TaskLikeFilters) {
  return Boolean(filters.filter) || Boolean(filters.channel);
}

export default function UsageLogsPage({
  section = "common",
}: {
  section?: string;
}) {
  const activeSection = coerceUsageLogsSection(section);
  const user = useAuthStore((state) => state.auth.user);
  const isAdmin = (user?.role ?? 0) >= ROLE.ADMIN;
  const { t } = useTranslation();

  const [page, setPage] = React.useState(1);
  const [logs, setLogs] = React.useState<LogItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(false);
  const [stats, setStats] = React.useState<LogStatistics | null>(null);
  const [sensitiveVisible, setSensitiveVisible] = React.useState(true);
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);
  const [commonFilters, setCommonFilters] = React.useState<CommonLogFilters>(
    createCommonFilters,
  );
  const [appliedCommonFilters, setAppliedCommonFilters] =
    React.useState<CommonLogFilters>(createCommonFilters);
  const [taskFilters, setTaskFilters] =
    React.useState<TaskLikeFilters>(createTaskFilters);
  const [appliedTaskFilters, setAppliedTaskFilters] =
    React.useState<TaskLikeFilters>(createTaskFilters);

  React.useEffect(() => {
    setPage(1);
  }, [activeSection]);

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      if (activeSection === "common") {
        const params = buildCommonLogParams(
          appliedCommonFilters,
          page,
          PAGE_SIZE,
          isAdmin,
        );
        const result = isAdmin ? await getAllLogs(params) : await getUserLogs(params);
        if (!result.success) {
          throw new Error(result.message || t("Failed to load logs"));
        }
        setLogs(result.data?.items ?? []);
        setTotal(result.data?.total ?? 0);
        return;
      }

      const params = buildTaskLikeParams(
        activeSection,
        appliedTaskFilters,
        page,
        PAGE_SIZE,
      );

      if (activeSection === "drawing") {
        const result = isAdmin
          ? await getAllMidjourneyLogs(params)
          : await getUserMidjourneyLogs(params);
        if (!result.success) {
          throw new Error(result.message || t("Failed to load logs"));
        }
        setLogs(result.data?.items ?? []);
        setTotal(result.data?.total ?? 0);
        return;
      }

      const result = isAdmin
        ? await getAllTaskLogs(params)
        : await getUserTaskLogs(params);
      if (!result.success) {
        throw new Error(result.message || t("Failed to load logs"));
      }
      setLogs(result.data?.items ?? []);
      setTotal(result.data?.total ?? 0);
    } catch (error) {
      toast.error(getErrorMessage(error, t("Failed to load logs")));
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    activeSection,
    appliedCommonFilters,
    appliedTaskFilters,
    isAdmin,
    page,
    t,
  ]);

  const fetchStats = React.useCallback(async () => {
    if (activeSection !== "common") {
      setStats(null);
      return;
    }

    setStatsLoading(true);
    try {
      const params = buildCommonLogParams(
        appliedCommonFilters,
        1,
        1,
        isAdmin,
      );
      const result = isAdmin ? await getLogStats(params) : await getUserLogStats(params);
      setStats(result.success ? result.data ?? null : null);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [activeSection, appliedCommonFilters, isAdmin]);

  React.useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  React.useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const applyCommonFilters = () => {
    setPage(1);
    setAppliedCommonFilters({ ...commonFilters });
  };

  const applyTaskFilters = () => {
    setPage(1);
    setAppliedTaskFilters({ ...taskFilters });
  };

  const resetCommonFilters = () => {
    const next = createCommonFilters();
    setCommonFilters(next);
    setAppliedCommonFilters(next);
    setPage(1);
  };

  const resetTaskFilters = () => {
    const next = createTaskFilters();
    setTaskFilters(next);
    setAppliedTaskFilters(next);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const meta = LOG_CATEGORY_META[activeSection];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-[var(--accent)]" />
            <h1 className="text-2xl font-bold">{t("nav.usageLogs")}</h1>
          </div>
          <p className="text-sm text-[var(--muted)]">{t(meta.description)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchLogs()}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          {t("common.refresh")}
        </Button>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-1">
        {LOG_CATEGORY_IDS.map((item) => {
          const itemMeta = LOG_CATEGORY_META[item];
          const active = item === activeSection;
          const Icon =
            item === "common" ? FileText : item === "drawing" ? Brush : Workflow;
          return (
            <Link
              key={item}
              href={itemMeta.href}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-[var(--accent)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-[var(--accent)]" : "text-[var(--muted)]",
                )}
              />
              {t(itemMeta.title)}
            </Link>
          );
        })}
      </nav>

      {activeSection === "common" ? (
        <CommonFiltersBar
          filters={commonFilters}
          isAdmin={isAdmin}
          sensitiveVisible={sensitiveVisible}
          onFiltersChange={setCommonFilters}
          onApply={applyCommonFilters}
          onReset={resetCommonFilters}
          onToggleSensitive={() => setSensitiveVisible((value) => !value)}
        />
      ) : (
        <TaskLikeFiltersBar
          category={activeSection}
          filters={taskFilters}
          isAdmin={isAdmin}
          onFiltersChange={setTaskFilters}
          onApply={applyTaskFilters}
          onReset={resetTaskFilters}
        />
      )}

      {activeSection === "common" ? (
        <CommonStats
          stats={stats}
          total={total}
          loading={statsLoading}
          sensitiveVisible={sensitiveVisible}
        />
      ) : null}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton />
          ) : activeSection === "common" ? (
            <CommonLogsTable
              logs={logs as UsageLog[]}
              isAdmin={isAdmin}
              sensitiveVisible={sensitiveVisible}
              onUserSelect={setSelectedUserId}
            />
          ) : activeSection === "drawing" ? (
            <DrawingLogsTable
              logs={logs as MidjourneyLog[]}
              isAdmin={isAdmin}
              onUserSelect={setSelectedUserId}
            />
          ) : (
            <TaskLogsTable
              logs={logs as TaskLog[]}
              isAdmin={isAdmin}
              onUserSelect={setSelectedUserId}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[var(--muted)]">
          {t("Page")}{" "}
          <span className="font-mono text-[var(--foreground)]">{page}</span>{" "}
          {t("of")}{" "}
          <span className="font-mono text-[var(--foreground)]">{totalPages}</span>
          <span className="mx-2">·</span>
          {t("Total")}{" "}
          <span className="font-mono text-[var(--foreground)]">
            {formatCount(total)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            {t("common.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            {t("common.next")}
          </Button>
        </div>
      </div>

      <UserInfoDialog
        userId={selectedUserId}
        open={selectedUserId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(null);
        }}
      />
    </div>
  );
}

function CommonFiltersBar(props: {
  filters: CommonLogFilters;
  isAdmin: boolean;
  sensitiveVisible: boolean;
  onFiltersChange: React.Dispatch<React.SetStateAction<CommonLogFilters>>;
  onApply: () => void;
  onReset: () => void;
  onToggleSensitive: () => void;
}) {
  const { t } = useTranslation();
  const secretType = props.sensitiveVisible ? "text" : "password";
  const update = (field: keyof CommonLogFilters, value: string) => {
    props.onFiltersChange((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterField label={t("Start Time")}>
            <Input
              type="datetime-local"
              value={props.filters.startTime}
              onChange={(event) => update("startTime", event.target.value)}
            />
          </FilterField>
          <FilterField label={t("End Time")}>
            <Input
              type="datetime-local"
              value={props.filters.endTime}
              onChange={(event) => update("endTime", event.target.value)}
            />
          </FilterField>
          <FilterField label={t("Log Type")}>
            <Select
              value={props.filters.type}
              onValueChange={(value) => update("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("All Types")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Types")}</SelectItem>
                {LOG_TYPES.map((item) => (
                  <SelectItem key={item.value} value={String(item.value)}>
                    {t(item.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label={t("Model Name")}>
            <Input
              value={props.filters.model}
              placeholder={t("Filter by model")}
              onChange={(event) => update("model", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") props.onApply();
              }}
            />
          </FilterField>
          <FilterField label={t("Token Name")}>
            <Input
              type={secretType}
              value={props.filters.token}
              placeholder={t("Filter by token")}
              onChange={(event) => update("token", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") props.onApply();
              }}
            />
          </FilterField>
          <FilterField label={t("Group")}>
            <Input
              type={secretType}
              value={props.filters.group}
              placeholder={t("Filter by group")}
              onChange={(event) => update("group", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") props.onApply();
              }}
            />
          </FilterField>
          {props.isAdmin ? (
            <>
              <FilterField label={t("Username")}>
                <Input
                  type={secretType}
                  value={props.filters.username}
                  placeholder={t("Filter by username")}
                  onChange={(event) => update("username", event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") props.onApply();
                  }}
                />
              </FilterField>
              <FilterField label={t("Channel ID")}>
                <Input
                  value={props.filters.channel}
                  placeholder={t("Filter by channel")}
                  onChange={(event) => update("channel", event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") props.onApply();
                  }}
                />
              </FilterField>
            </>
          ) : null}
          <FilterField label={t("Request ID")}>
            <Input
              value={props.filters.requestId}
              placeholder={t("Filter by request ID")}
              onChange={(event) => update("requestId", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") props.onApply();
              }}
            />
          </FilterField>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={props.onToggleSensitive}>
            {props.sensitiveVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {props.sensitiveVisible ? t("Hide sensitive filters") : t("Show sensitive filters")}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={props.onReset}
              disabled={!hasCommonFilters(props.filters)}
            >
              {t("common.reset")}
            </Button>
            <Button size="sm" onClick={props.onApply}>
              <Search className="h-4 w-4" />
              {t("common.search")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskLikeFiltersBar(props: {
  category: Extract<LogCategory, "drawing" | "task">;
  filters: TaskLikeFilters;
  isAdmin: boolean;
  onFiltersChange: React.Dispatch<React.SetStateAction<TaskLikeFilters>>;
  onApply: () => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const update = (field: keyof TaskLikeFilters, value: string) => {
    props.onFiltersChange((prev) => ({ ...prev, [field]: value }));
  };
  const taskLabel = props.category === "drawing" ? "Midjourney Task ID" : "Task ID";

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterField label={t("Start Time")}>
            <Input
              type="datetime-local"
              value={props.filters.startTime}
              onChange={(event) => update("startTime", event.target.value)}
            />
          </FilterField>
          <FilterField label={t("End Time")}>
            <Input
              type="datetime-local"
              value={props.filters.endTime}
              onChange={(event) => update("endTime", event.target.value)}
            />
          </FilterField>
          <FilterField label={t(taskLabel)}>
            <Input
              value={props.filters.filter}
              placeholder={t("Filter by task ID")}
              onChange={(event) => update("filter", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") props.onApply();
              }}
            />
          </FilterField>
          {props.isAdmin ? (
            <FilterField label={t("Channel ID")}>
              <Input
                value={props.filters.channel}
                placeholder={t("Filter by channel")}
                onChange={(event) => update("channel", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") props.onApply();
                }}
              />
            </FilterField>
          ) : null}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={props.onReset}
            disabled={!hasTaskFilters(props.filters)}
          >
            {t("common.reset")}
          </Button>
          <Button size="sm" onClick={props.onApply}>
            <Search className="h-4 w-4" />
            {t("common.search")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[var(--muted)]">{label}</Label>
      {children}
    </div>
  );
}

function CommonStats({
  stats,
  total,
  loading,
  sensitiveVisible,
}: {
  stats: LogStatistics | null;
  total: number;
  loading: boolean;
  sensitiveVisible: boolean;
}) {
  const { t } = useTranslation();
  const cards = [
    {
      label: t("Usage"),
      value: sensitiveVisible ? formatQuota(stats?.quota ?? 0) : "••••",
      icon: FileText,
    },
    { label: t("RPM"), value: formatCount(stats?.rpm ?? 0), icon: RefreshCw },
    { label: t("TPM"), value: formatCount(stats?.tpm ?? 0), icon: Clock },
    { label: t("Records"), value: formatCount(total), icon: Workflow },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted)]">
                {item.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-[var(--muted)]" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="font-mono text-2xl font-bold">{item.value}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-md" />
      ))}
    </div>
  );
}

function CommonLogsTable({
  logs,
  isAdmin,
  sensitiveVisible,
  onUserSelect,
}: {
  logs: UsageLog[];
  isAdmin: boolean;
  sensitiveVisible: boolean;
  onUserSelect: (userId: number) => void;
}) {
  const { t } = useTranslation();

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-5 w-5" />}
        title={t("No Logs Found")}
        description={t("No usage logs available. Logs will appear here once API calls are made.")}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.time")}</TableHead>
            <TableHead>{t("common.type")}</TableHead>
            <TableHead>{t("pricing.model")}</TableHead>
            <TableHead>{t("Tokens")}</TableHead>
            <TableHead>{t("Usage")}</TableHead>
            <TableHead>{t("User / Group")}</TableHead>
            <TableHead>{t("Channel / Request")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const typeConfig = getLogTypeConfig(log.type);
            const promptTokens = log.prompt_tokens ?? 0;
            const completionTokens = log.completion_tokens ?? 0;
            return (
              <TableRow
                key={`${log.id}-${log.request_id ?? ""}`}
                className={cn(
                  log.type === 6 && "bg-red-500/5",
                  log.type === 7 && "bg-blue-500/5",
                )}
              >
                <TableCell className="whitespace-nowrap text-xs text-[var(--muted)]">
                  {formatUnixSeconds(log.created_at)}
                </TableCell>
                <TableCell>
                  <StatusBadge variant={typeConfig.variant}>
                    {t(typeConfig.label)}
                  </StatusBadge>
                </TableCell>
                <TableCell className="min-w-[220px]">
                  <div className="space-y-1">
                    <div className="font-mono text-xs">
                      {log.model_name || "-"}
                    </div>
                    {log.content ? (
                      <div className="max-w-[360px] truncate text-xs text-[var(--muted)]" title={log.content}>
                        {log.content}
                      </div>
                    ) : null}
                    {log.is_stream ? (
                      <Badge variant="outline" className="text-[10px]">
                        stream
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <div>{formatCount(promptTokens)} / {formatCount(completionTokens)}</div>
                  <div className="text-[var(--muted)]">
                    {t("Total")}: {formatCount(promptTokens + completionTokens)}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">
                  <div>{sensitiveVisible ? formatQuota(log.quota ?? 0) : "••••"}</div>
                  <div className="text-[var(--muted)]">
                    {formatDuration(log.use_time)}
                  </div>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <div className="space-y-1 text-sm">
                    {isAdmin && log.user_id ? (
                      <button
                        type="button"
                        onClick={() => onUserSelect(log.user_id)}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {log.username || `#${log.user_id}`}
                      </button>
                    ) : (
                      <span>{log.username || "-"}</span>
                    )}
                    <div className="text-xs text-[var(--muted)]">
                      {sensitiveVisible ? log.group || "-" : "••••"}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <div className="space-y-1 text-xs">
                    <div>
                      #{log.channel ?? 0}
                      {log.channel_name ? ` · ${log.channel_name}` : ""}
                    </div>
                    {log.request_id ? (
                      <div className="flex items-center gap-1 text-[var(--muted)]">
                        <span className="font-mono">
                          {truncateMiddle(log.request_id)}
                        </span>
                        <CopyButton value={log.request_id} size="sm" />
                      </div>
                    ) : (
                      <span className="text-[var(--muted)]">-</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function DrawingLogsTable({
  logs,
  isAdmin,
  onUserSelect,
}: {
  logs: MidjourneyLog[];
  isAdmin: boolean;
  onUserSelect: (userId: number) => void;
}) {
  const { t } = useTranslation();

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<Brush className="h-5 w-5" />}
        title={t("No Logs Found")}
        description={t("No drawing logs available. Logs will appear here once tasks are submitted.")}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("Submit Time")}</TableHead>
            <TableHead>{t("Action")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("Prompt")}</TableHead>
            <TableHead>{t("Progress")}</TableHead>
            <TableHead>{t("User / Channel")}</TableHead>
            <TableHead>{t("Result")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const action = getTaskActionConfig(log.action);
            const status = getTaskStatusConfig(log.status);
            const progress = getProgressValue(log.progress);
            return (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-xs text-[var(--muted)]">
                  {formatUnixMilliseconds(log.submit_time)}
                </TableCell>
                <TableCell>
                  <StatusBadge variant={action.variant}>{t(action.label)}</StatusBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge variant={status.variant}>{t(status.label)}</StatusBadge>
                </TableCell>
                <TableCell className="min-w-[280px]">
                  <div className="space-y-1">
                    <div className="max-w-[420px] truncate text-sm" title={log.prompt}>
                      {log.prompt || "-"}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                      <span className="font-mono">{truncateMiddle(log.mj_id || "-")}</span>
                      {log.mj_id ? <CopyButton value={log.mj_id} size="sm" /> : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[140px]">
                  <div className="space-y-1">
                    <Progress value={progress} />
                    <div className="text-xs text-[var(--muted)]">
                      {log.progress || "0%"}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => onUserSelect(log.user_id)}
                      className="text-[var(--accent)] hover:underline"
                    >
                      #{log.user_id}
                    </button>
                  ) : (
                    <span>#{log.user_id}</span>
                  )}
                  <div className="text-xs text-[var(--muted)]">
                    {t("Channel")} #{log.channel_id}
                  </div>
                </TableCell>
                <TableCell className="min-w-[180px]">
                  {log.fail_reason ? (
                    <div className="flex max-w-[260px] items-start gap-2 text-xs text-[var(--destructive)]">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-2" title={log.fail_reason}>
                        {log.fail_reason}
                      </span>
                    </div>
                  ) : log.image_url ? (
                    <a
                      href={log.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[var(--accent)] hover:underline"
                    >
                      {t("Open result")}
                    </a>
                  ) : (
                    <span className="text-sm text-[var(--muted)]">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskLogsTable({
  logs,
  isAdmin,
  onUserSelect,
}: {
  logs: TaskLog[];
  isAdmin: boolean;
  onUserSelect: (userId: number) => void;
}) {
  const { t } = useTranslation();

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<Workflow className="h-5 w-5" />}
        title={t("No Logs Found")}
        description={t("No task logs available. Logs will appear here once async tasks are submitted.")}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("Submit Time")}</TableHead>
            <TableHead>{t("Platform / Action")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("Task ID")}</TableHead>
            <TableHead>{t("Progress")}</TableHead>
            <TableHead>{t("User / Channel")}</TableHead>
            <TableHead>{t("Result")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const action = getTaskActionConfig(log.action);
            const status = getTaskStatusConfig(log.status);
            const progress = getProgressValue(log.progress);
            return (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-xs text-[var(--muted)]">
                  {formatUnixSeconds(log.submit_time)}
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <div className="space-y-1">
                    <Badge variant="outline">{log.platform || "-"}</Badge>
                    <div>
                      <StatusBadge variant={action.variant}>{t(action.label)}</StatusBadge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge variant={status.variant}>{t(status.label)}</StatusBadge>
                </TableCell>
                <TableCell className="min-w-[220px]">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">
                      {truncateMiddle(log.task_id || "-")}
                    </span>
                    {log.task_id ? <CopyButton value={log.task_id} size="sm" /> : null}
                  </div>
                  {typeof log.quota === "number" ? (
                    <div className="text-xs text-[var(--muted)]">
                      {formatQuota(log.quota)}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="min-w-[140px]">
                  <div className="space-y-1">
                    <Progress value={progress} />
                    <div className="text-xs text-[var(--muted)]">
                      {log.progress || "0%"}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => onUserSelect(log.user_id)}
                      className="text-[var(--accent)] hover:underline"
                    >
                      {log.username || `#${log.user_id}`}
                    </button>
                  ) : (
                    <span>{log.username || `#${log.user_id}`}</span>
                  )}
                  <div className="text-xs text-[var(--muted)]">
                    {t("Channel")} #{log.channel_id}
                  </div>
                </TableCell>
                <TableCell className="min-w-[180px]">
                  {log.fail_reason ? (
                    <div className="flex max-w-[260px] items-start gap-2 text-xs text-[var(--destructive)]">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-2" title={log.fail_reason}>
                        {log.fail_reason}
                      </span>
                    </div>
                  ) : log.result_url ? (
                    <a
                      href={log.result_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[var(--accent)] hover:underline"
                    >
                      {t("Open result")}
                    </a>
                  ) : (
                    <span className="text-sm text-[var(--muted)]">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function UserInfoDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState<UserInfo | null>(null);

  React.useEffect(() => {
    if (!open || userId == null) return;

    setLoading(true);
    setUser(null);
    getUserInfo(userId)
      .then((result) => {
        if (result.success && result.data) {
          setUser(result.data);
        } else {
          toast.error(result.message || t("Failed to load user"));
        }
      })
      .catch((error: unknown) => {
        toast.error(getErrorMessage(error, t("Failed to load user")));
      })
      .finally(() => setLoading(false));
  }, [open, t, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-[var(--accent)]" />
            {t("User Details")}
          </DialogTitle>
          <DialogDescription>
            {t("Usage log user snapshot")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10" />
            ))}
          </div>
        ) : user ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem label="ID" value={String(user.id)} />
            <InfoItem label={t("common.username")} value={user.username} />
            <InfoItem
              label={t("Display Name")}
              value={user.display_name || "-"}
            />
            <InfoItem label={t("Group")} value={user.group || "-"} />
            <InfoItem label={t("Remaining Quota")} value={formatQuota(user.quota)} />
            <InfoItem label={t("Used Quota")} value={formatQuota(user.used_quota)} />
            <InfoItem
              label={t("Requests")}
              value={formatCount(user.request_count)}
            />
            <InfoItem label={t("Remark")} value={user.remark || "-"} />
          </div>
        ) : (
          <EmptyState
            icon={<UserRound className="h-5 w-5" />}
            title={t("No user selected")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] p-3">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="mt-1 break-words text-sm font-medium">{value}</div>
    </div>
  );
}
