"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Edit,
  Loader2,
  MoreHorizontal,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { formatQuota, formatTimestampToDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BulkActions, TableSkeleton } from "@/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GroupBadge } from "@/components/group-badge";
import { StatusBadge } from "@/components/status-badge";
import { API_KEY_STATUS, API_KEY_STATUSES, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/features/keys/constants";
import {
  batchDeleteAdminTokens,
  getAdminTokens,
  searchAdminTokens,
  updateAdminTokenStatus,
} from "../api";
import type { AdminToken, GetAdminTokensResponse } from "../types";
import { useAdminTokens } from "./admin-tokens-provider";

const PAGE_SIZE = 20;

function normalizeList(result: GetAdminTokensResponse | { data?: AdminToken[] }) {
  if (Array.isArray(result.data)) {
    return { items: result.data, total: result.data.length };
  }
  return {
    items: result.data?.items ?? [],
    total: result.data?.total ?? result.data?.items?.length ?? 0,
  };
}

function maskKey(key: string): string {
  const value = key.startsWith("sk-") ? key : `sk-${key}`;
  if (value.length <= 16) return value;
  return `${value.slice(0, 10)}...${value.slice(-4)}`;
}

function AdminTokenStatusBadge({ token }: { token: AdminToken }) {
  const { t } = useTranslation();
  const statusConfig = API_KEY_STATUSES[token.status];
  return statusConfig ? (
    <StatusBadge
      label={t(statusConfig.label)}
      variant={statusConfig.variant}
      showDot={statusConfig.showDot}
      copyable={false}
    />
  ) : (
    <StatusBadge label={String(token.status)} variant="neutral" copyable={false} />
  );
}

function AdminTokenRowActions({ token }: { token: AdminToken }) {
  const { t } = useTranslation();
  const { setOpen, setCurrentRow, triggerRefresh } = useAdminTokens();
  const [toggling, setToggling] = React.useState(false);
  const enabled = token.status === API_KEY_STATUS.ENABLED;

  const toggleStatus = async () => {
    setToggling(true);
    try {
      const nextStatus = enabled ? API_KEY_STATUS.DISABLED : API_KEY_STATUS.ENABLED;
      const result = await updateAdminTokenStatus(token.id, nextStatus);
      if (result.success) {
        toast.success(
          t(enabled ? SUCCESS_MESSAGES.API_KEY_DISABLED : SUCCESS_MESSAGES.API_KEY_ENABLED),
        );
        triggerRefresh();
      } else {
        toast.error(result.message || t(ERROR_MESSAGES.STATUS_UPDATE_FAILED));
      }
    } catch {
      toast.error(t(ERROR_MESSAGES.UNEXPECTED));
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", enabled ? "text-[var(--destructive)]" : "text-[var(--success)]")}
        onClick={toggleStatus}
        disabled={toggling}
        aria-label={enabled ? t("Disable") : t("Enable")}
      >
        {toggling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : enabled ? (
          <PowerOff className="h-4 w-4" />
        ) : (
          <Power className="h-4 w-4" />
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t("Open menu")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(token);
              setOpen("update");
            }}
          >
            {t("Edit")}
            <DropdownMenuShortcut>
              <Edit className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-[var(--destructive)] focus:text-[var(--destructive)]"
            onClick={() => {
              setCurrentRow(token);
              setOpen("delete");
            }}
          >
            {t("Delete")}
            <DropdownMenuShortcut>
              <Trash2 className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function AdminTokensTable() {
  const { t } = useTranslation();
  const { refreshTrigger, triggerRefresh, setOpen, setCurrentRow } = useAdminTokens();
  const [items, setItems] = React.useState<AdminToken[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = React.useState(false);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allPageSelected = items.length > 0 && items.every((item) => selected.has(item.id));
  const somePageSelected = !allPageSelected && items.some((item) => selected.has(item.id));

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const keyword = search.trim();
      const result = keyword
        ? await searchAdminTokens({ keyword, p: page, page_size: PAGE_SIZE })
        : await getAdminTokens({ p: page, page_size: PAGE_SIZE });
      if (!result.success) {
        toast.error(result.message || t(keyword ? ERROR_MESSAGES.SEARCH_FAILED : ERROR_MESSAGES.LOAD_FAILED));
        setItems([]);
        setTotal(0);
        return;
      }
      const normalized = normalizeList(result);
      setItems(normalized.items);
      setTotal(normalized.total);
    } catch {
      toast.error(t(ERROR_MESSAGES.LOAD_FAILED));
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  React.useEffect(() => {
    void load();
  }, [load, refreshTrigger]);

  React.useEffect(() => {
    setSelected(new Set());
  }, [items]);

  const toggleSelected = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePageSelection = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const item of items) next.delete(item.id);
      } else {
        for (const item of items) next.add(item.id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("Filter by name, user, or token...")}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {t("Refresh")}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setCurrentRow(null);
              setOpen("create");
            }}
          >
            <ShieldCheck className="h-4 w-4" />
            {t("Create Admin Token")}
          </Button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={8} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                    onCheckedChange={togglePageSelection}
                    aria-label={t("Select all")}
                  />
                </TableHead>
                <TableHead>{t("Token Name")}</TableHead>
                <TableHead>{t("User")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("API Key")}</TableHead>
                <TableHead>{t("Quota")}</TableHead>
                <TableHead>{t("Group")}</TableHead>
                <TableHead>{t("Created")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-[var(--muted)]">
                    {t("No Admin Tokens Found")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((token) => (
                  <TableRow key={token.id} className={token.status !== API_KEY_STATUS.ENABLED ? "opacity-75" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(token.id)}
                        onCheckedChange={() => toggleSelected(token.id)}
                        aria-label={t("Select row")}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[220px] truncate font-medium">{token.name || "-"}</div>
                      <div className="font-mono text-xs text-[var(--muted)]">#{token.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[180px] leading-tight">
                        <div className="truncate font-medium">{token.user_name || t("Unknown")}</div>
                        <div className="font-mono text-xs text-[var(--muted)]">#{token.user_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminTokenStatusBadge token={token} />
                    </TableCell>
                    <TableCell>
                      <code className="rounded-md border border-[var(--border)] bg-[var(--surface)]/60 px-2 py-1 font-mono text-xs">
                        {maskKey(token.key)}
                      </code>
                    </TableCell>
                    <TableCell>
                      {token.unlimited_quota ? (
                        <StatusBadge label={t("Unlimited")} variant="neutral" copyable={false} />
                      ) : (
                        <div className="space-y-0.5 font-mono text-xs">
                          <div>{formatQuota(token.remain_quota)}</div>
                          <div className="text-[var(--muted)]">
                            {t("Used")}: {formatQuota(token.used_quota)}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        <GroupBadge group={token.group || "default"} />
                        {token.backup_group
                          ? token.backup_group.split(",").filter(Boolean).map((group) => (
                              <GroupBadge key={group} group={group} className="opacity-70" />
                            ))
                          : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--muted)]">
                      {formatTimestampToDateOnly(token.created_time)}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminTokenRowActions token={token} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="flex flex-col gap-3 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[var(--foreground)]">{total}</span> {t("items")}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            {t("Previous")}
          </Button>
          <span className="min-w-24 text-center text-xs">
            {t("Page")} <span className="text-[var(--foreground)]">{page}</span> {t("of")}{" "}
            <span className="text-[var(--foreground)]">{totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            {t("Next")}
          </Button>
        </div>
      </div>

      <BulkActions
        selectedCount={selected.size}
        onClearSelection={() => setSelected(new Set())}
        onDelete={() => setBatchDeleteOpen(true)}
      />

      <ConfirmDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        title={t("Delete selected admin tokens?")}
        description={t("This action cannot be undone.")}
        confirmText={t("Delete")}
        cancelText={t("Cancel")}
        variant="destructive"
        onConfirm={async () => {
          const result = await batchDeleteAdminTokens(Array.from(selected));
          if (result.success) {
            toast.success(t("Deleted {{count}} API key(s)", { count: selected.size }));
            setSelected(new Set());
            triggerRefresh();
          } else {
            toast.error(result.message || t(ERROR_MESSAGES.BATCH_DELETE_FAILED));
          }
        }}
      />
    </div>
  );
}
