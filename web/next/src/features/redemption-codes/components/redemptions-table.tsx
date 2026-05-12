"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Copy,
  Edit,
  Eraser,
  Loader2,
  MoreHorizontal,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Ticket,
  Trash2,
} from "lucide-react";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
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
import { MaskedValueDisplay } from "@/components/masked-value-display";
import { StatusBadge } from "@/components/status-badge";
import {
  deleteInvalidRedemptions,
  getRedemptions,
  searchRedemptions,
  updateRedemptionStatus,
} from "../api";
import {
  ERROR_MESSAGES,
  REDEMPTION_STATUS,
  REDEMPTION_STATUSES,
  SUCCESS_MESSAGES,
} from "../constants";
import { isRedemptionExpired } from "../lib";
import { REDEMPTION_TYPES, type GetRedemptionsResponse, type Redemption } from "../types";
import { useRedemptions } from "./redemptions-provider";

const PAGE_SIZE = 20;

function normalizeList(result: GetRedemptionsResponse | { data?: Redemption[] }) {
  if (Array.isArray(result.data)) {
    return { items: result.data, total: result.data.length };
  }
  return {
    items: result.data?.items ?? [],
    total: result.data?.total ?? result.data?.items?.length ?? 0,
  };
}

function maskedCode(code: string): string {
  if (code.length <= 18) return code;
  return `${code.slice(0, 8)}${"*".repeat(8)}${code.slice(-6)}`;
}

function RedemptionStatusBadge({ redemption }: { redemption: Redemption }) {
  const { t } = useTranslation();
  if (isRedemptionExpired(redemption.expired_time, redemption.status)) {
    return <StatusBadge label={t("Expired")} variant="warning" copyable={false} />;
  }
  const statusConfig = REDEMPTION_STATUSES[redemption.status];
  return statusConfig ? (
    <StatusBadge
      label={t(statusConfig.labelKey)}
      variant={statusConfig.variant}
      showDot={statusConfig.showDot}
      copyable={false}
    />
  ) : (
    <StatusBadge label={String(redemption.status)} variant="neutral" copyable={false} />
  );
}

function RedemptionContentCell({ redemption }: { redemption: Redemption }) {
  const { t } = useTranslation();
  if (redemption.type === REDEMPTION_TYPES.SUBSCRIPTION) {
    return (
      <StatusBadge
        label={t("Subscription plan #{{id}}", {
          id: redemption.subscription_plan_id || "-",
        })}
        variant="info"
        copyable={false}
      />
    );
  }
  return <span className="font-mono text-xs">{formatQuota(redemption.quota)}</span>;
}

function RedemptionRowActions({ redemption }: { redemption: Redemption }) {
  const { t } = useTranslation();
  const { setOpen, setCurrentRow, triggerRefresh } = useRedemptions();
  const [toggling, setToggling] = React.useState(false);
  const enabled = redemption.status === REDEMPTION_STATUS.ENABLED;
  const used = redemption.status === REDEMPTION_STATUS.USED || Boolean(redemption.used_user_id);
  const expired = isRedemptionExpired(redemption.expired_time, redemption.status);
  const canToggle = !used && !expired;
  const canEdit = enabled && !expired && !used;

  const toggleStatus = async () => {
    setToggling(true);
    try {
      const nextStatus = enabled ? REDEMPTION_STATUS.DISABLED : REDEMPTION_STATUS.ENABLED;
      const result = await updateRedemptionStatus(redemption.id, nextStatus);
      if (result.success) {
        toast.success(
          t(enabled ? SUCCESS_MESSAGES.REDEMPTION_DISABLED : SUCCESS_MESSAGES.REDEMPTION_ENABLED),
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t("Open menu")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          disabled={!canEdit}
          onClick={() => {
            setCurrentRow(redemption);
            setOpen("update");
          }}
        >
          {t("Edit")}
          <DropdownMenuShortcut>
            <Edit className="h-4 w-4" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        {canToggle ? (
          <DropdownMenuItem onClick={toggleStatus} disabled={toggling}>
            {enabled ? t("Disable") : t("Enable")}
            <DropdownMenuShortcut>
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : enabled ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-[var(--destructive)] focus:text-[var(--destructive)]"
          onClick={() => {
            setCurrentRow(redemption);
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
  );
}

export function RedemptionsTable() {
  const { t } = useTranslation();
  const { refreshTrigger, triggerRefresh, setOpen, setCurrentRow } = useRedemptions();
  const [items, setItems] = React.useState<Redemption[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [deleteInvalidOpen, setDeleteInvalidOpen] = React.useState(false);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectedRows = items.filter((item) => selected.has(item.id));
  const allPageSelected = items.length > 0 && items.every((item) => selected.has(item.id));
  const somePageSelected = !allPageSelected && items.some((item) => selected.has(item.id));

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const keyword = search.trim();
      const result = keyword
        ? await searchRedemptions({ keyword, p: page, page_size: PAGE_SIZE })
        : await getRedemptions({ p: page, page_size: PAGE_SIZE });
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

  const copySelected = async () => {
    const content = selectedRows.map((item) => `${item.name}\t${item.key}`).join("\n");
    if (content && (await copyToClipboard(content))) {
      toast.success(t("Codes copied!"));
    }
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
            placeholder={t("Filter by name or ID...")}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {t("Refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteInvalidOpen(true)}>
            <Eraser className="h-4 w-4" />
            {t("Delete invalid")}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setCurrentRow(null);
              setOpen("create");
            }}
          >
            <Ticket className="h-4 w-4" />
            {t("Create Code")}
          </Button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={9} />
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
                <TableHead>ID</TableHead>
                <TableHead>{t("Name")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Code")}</TableHead>
                <TableHead>{t("Content")}</TableHead>
                <TableHead>{t("Expires")}</TableHead>
                <TableHead>{t("Redeemed By")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-[var(--muted)]">
                    {t("No Redemption Codes Found")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((redemption) => (
                  <TableRow
                    key={redemption.id}
                    className={
                      redemption.status !== REDEMPTION_STATUS.ENABLED ||
                      isRedemptionExpired(redemption.expired_time, redemption.status)
                        ? "opacity-75"
                        : undefined
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(redemption.id)}
                        onCheckedChange={() => toggleSelected(redemption.id)}
                        aria-label={t("Select row")}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{redemption.id}</TableCell>
                    <TableCell>
                      <div className="max-w-[180px] truncate font-medium">
                        {redemption.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <RedemptionStatusBadge redemption={redemption} />
                    </TableCell>
                    <TableCell>
                      <MaskedValueDisplay
                        fullValue={redemption.key}
                        maskedValue={maskedCode(redemption.key)}
                        copyTooltip={t("Copy code")}
                        copyAriaLabel={t("Copy redemption code")}
                      />
                    </TableCell>
                    <TableCell>
                      <RedemptionContentCell redemption={redemption} />
                    </TableCell>
                    <TableCell className="text-xs text-[var(--muted)]">
                      {redemption.expired_time > 0
                        ? formatTimestampToDateOnly(redemption.expired_time)
                        : t("Never")}
                    </TableCell>
                    <TableCell className="text-xs">
                      {redemption.used_user_id ? (
                        <div>
                          <div className="font-mono">#{redemption.used_user_id}</div>
                          {redemption.redeemed_time ? (
                            <div className="text-[var(--muted)]">
                              {formatTimestampToDateOnly(redemption.redeemed_time)}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-[var(--muted)]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <RedemptionRowActions redemption={redemption} />
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
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-full text-xs"
          onClick={copySelected}
        >
          <Copy className="h-3.5 w-3.5" />
          {t("Copy")}
        </Button>
      </BulkActions>

      <ConfirmDialog
        open={deleteInvalidOpen}
        onOpenChange={setDeleteInvalidOpen}
        title={t("Delete Invalid Redemption Codes?")}
        description={t("This will delete used, disabled, and expired redemption codes. This action cannot be undone.")}
        confirmText={t("Delete Invalid")}
        cancelText={t("Cancel")}
        variant="destructive"
        onConfirm={async () => {
          const result = await deleteInvalidRedemptions();
          if (result.success) {
            toast.success(
              t("Successfully deleted {{count}} invalid redemption codes", {
                count: result.data || 0,
              }),
            );
            triggerRefresh();
          } else {
            toast.error(result.message || t(ERROR_MESSAGES.DELETE_INVALID_FAILED));
          }
        }}
      />
    </div>
  );
}
