"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Edit,
  Eye,
  EyeOff,
  KeyRound,
  Link,
  Loader2,
  MoreHorizontal,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { formatQuota, formatTimestampToDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BulkActions } from "@/components/data-table";
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
import { TableSkeleton } from "@/components/data-table";
import { GroupBadge } from "@/components/group-badge";
import { StatusBadge } from "@/components/status-badge";
import { getApiKeys, searchApiKeys, updateApiKeyStatus, batchDeleteApiKeys } from "../api";
import { API_KEY_STATUS, API_KEY_STATUSES, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants";
import type { ApiKey, GetApiKeysResponse } from "../types";
import { useApiKeys } from "./api-keys-provider";

const PAGE_SIZE = 20;

function normalizeList(result: GetApiKeysResponse | { data?: ApiKey[] }): {
  items: ApiKey[];
  total: number;
} {
  if (Array.isArray(result.data)) {
    return { items: result.data, total: result.data.length };
  }
  const pageData = result.data as GetApiKeysResponse["data"];
  return {
    items: pageData?.items ?? [],
    total: pageData?.total ?? pageData?.items?.length ?? 0,
  };
}

function getMaskedKey(token: ApiKey): string {
  const value = token.key.startsWith("sk-") ? token.key : `sk-${token.key}`;
  if (value.length <= 16) return value;
  return `${value.slice(0, 10)}...${value.slice(-4)}`;
}

function getServerAddress(): string {
  try {
    const raw = window.localStorage.getItem("status");
    if (raw) {
      const status = JSON.parse(raw) as { server_address?: string };
      if (status.server_address) return status.server_address;
    }
  } catch {}
  return window.location.origin;
}

function encodeConnectionString(key: string, url: string): string {
  return JSON.stringify({
    _type: "newapi_channel_conn",
    key,
    url,
  });
}

function KeyValueCell({ apiKey }: { apiKey: ApiKey }) {
  const { t } = useTranslation();
  const { resolveRealKey, resolvedKeys, loadingKeys, copiedKeyId, markKeyCopied } = useApiKeys();
  const [revealed, setRevealed] = React.useState(false);
  const fullKeyPromise = React.useCallback(() => resolveRealKey(apiKey.id), [apiKey.id, resolveRealKey]);
  const isLoading = Boolean(loadingKeys[apiKey.id]);
  const copied = copiedKeyId === apiKey.id;
  const displayValue = revealed && resolvedKeys[apiKey.id] ? resolvedKeys[apiKey.id] : getMaskedKey(apiKey);

  const copyRealKey = async () => {
    const fullKey = await fullKeyPromise();
    if (!fullKey) return;
    if (await copyToClipboard(fullKey)) {
      markKeyCopied(apiKey.id);
      toast.success(t("Copied"));
    }
  };

  const reveal = async () => {
    if (!revealed) await fullKeyPromise();
    setRevealed((value) => !value);
  };

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <code className="max-w-[260px] truncate rounded-md border border-[var(--border)] bg-[var(--surface)]/60 px-2 py-1 font-mono text-xs text-[var(--foreground)]">
        {displayValue}
      </code>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={reveal}
        disabled={isLoading}
        aria-label={revealed ? t("Hide") : t("Reveal")}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : revealed ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={copyRealKey}
        disabled={isLoading}
        aria-label={t("Copy Key")}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[var(--success)]" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

function ApiKeyStatusBadge({ apiKey }: { apiKey: ApiKey }) {
  const { t } = useTranslation();
  const statusConfig = API_KEY_STATUSES[apiKey.status];
  if (!statusConfig) return <Badge variant="outline">{apiKey.status}</Badge>;
  return (
    <StatusBadge
      label={t(statusConfig.label)}
      variant={statusConfig.variant}
      showDot={statusConfig.showDot}
      copyable={false}
    />
  );
}

function ApiKeyRowActions({ apiKey }: { apiKey: ApiKey }) {
  const { t } = useTranslation();
  const {
    setOpen,
    setCurrentRow,
    triggerRefresh,
    resolveRealKey,
  } = useApiKeys();
  const [toggling, setToggling] = React.useState(false);
  const enabled = apiKey.status === API_KEY_STATUS.ENABLED;

  const toggleStatus = async () => {
    setToggling(true);
    try {
      const nextStatus = enabled ? API_KEY_STATUS.DISABLED : API_KEY_STATUS.ENABLED;
      const result = await updateApiKeyStatus(apiKey.id, nextStatus);
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

  const copyConnection = async () => {
    const realKey = await resolveRealKey(apiKey.id);
    if (!realKey) return;
    if (await copyToClipboard(encodeConnectionString(realKey, getServerAddress()))) {
      toast.success(t("Copied"));
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          enabled
            ? "text-[var(--destructive)]"
            : "text-[var(--success)]",
        )}
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
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => resolveRealKey(apiKey.id).then((key) => key && copyToClipboard(key).then((ok) => ok && toast.success(t("Copied"))))}>
            {t("Copy Key")}
            <DropdownMenuShortcut>
              <Copy className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyConnection}>
            {t("Copy Connection Info")}
            <DropdownMenuShortcut>
              <Link className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(apiKey);
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
              setCurrentRow(apiKey);
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

export function ApiKeysTable() {
  const { t } = useTranslation();
  const {
    refreshTrigger,
    triggerRefresh,
    setOpen,
    setCurrentRow,
    resolveRealKeysBatch,
  } = useApiKeys();
  const [items, setItems] = React.useState<ApiKey[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = React.useState(false);
  const [batchCopying, setBatchCopying] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectedRows = items.filter((item) => selected.has(item.id));
  const allPageSelected = items.length > 0 && items.every((item) => selected.has(item.id));
  const somePageSelected = !allPageSelected && items.some((item) => selected.has(item.id));

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const keyword = search.trim();
      const result = keyword
        ? await searchApiKeys({ keyword, p: page, size: PAGE_SIZE })
        : await getApiKeys({ p: page, size: PAGE_SIZE });
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

  const handleBatchCopy = async () => {
    if (selectedRows.length === 0) return;
    setBatchCopying(true);
    try {
      const ids = selectedRows.map((item) => item.id);
      const keyMap = await resolveRealKeysBatch(ids);
      const content = selectedRows
        .map((item) => {
          const key = keyMap[item.id];
          return key ? `${item.name}\t${key}` : "";
        })
        .filter(Boolean)
        .join("\n");
      if (content && (await copyToClipboard(content))) {
        toast.success(t("Copied {{count}} key(s)", { count: selectedRows.length }));
      }
    } finally {
      setBatchCopying(false);
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
            placeholder={t("Filter by name or key...")}
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
            <KeyRound className="h-4 w-4" />
            {t("Create API Key")}
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
                <TableHead>{t("Name")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("API Key")}</TableHead>
                <TableHead>{t("Quota")}</TableHead>
                <TableHead>{t("Group")}</TableHead>
                <TableHead>{t("Expires")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-[var(--muted)]">
                    {t("No API Keys Found")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((apiKey) => {
                  const disabled = apiKey.status !== API_KEY_STATUS.ENABLED;
                  return (
                    <TableRow
                      key={apiKey.id}
                      data-state={selected.has(apiKey.id) ? "selected" : undefined}
                      className={disabled ? "opacity-75" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selected.has(apiKey.id)}
                          onCheckedChange={() => toggleSelected(apiKey.id)}
                          aria-label={t("Select row")}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[220px] truncate font-medium">
                          {apiKey.name || "-"}
                        </div>
                        <div className="font-mono text-xs text-[var(--muted)]">#{apiKey.id}</div>
                      </TableCell>
                      <TableCell>
                        <ApiKeyStatusBadge apiKey={apiKey} />
                      </TableCell>
                      <TableCell>
                        <KeyValueCell apiKey={apiKey} />
                      </TableCell>
                      <TableCell>
                        {apiKey.unlimited_quota ? (
                          <StatusBadge label={t("Unlimited")} variant="neutral" copyable={false} />
                        ) : (
                          <div className="space-y-0.5 font-mono text-xs">
                            <div>{formatQuota(apiKey.remain_quota)}</div>
                            <div className="text-[var(--muted)]">
                              {t("Used")}: {formatQuota(apiKey.used_quota)}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[220px] flex-wrap gap-1">
                          <GroupBadge group={apiKey.group || "default"} />
                          {apiKey.backup_group
                            ? apiKey.backup_group.split(",").filter(Boolean).map((group) => (
                                <GroupBadge key={group} group={group} className="opacity-70" />
                              ))
                            : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[var(--muted)]">
                        {apiKey.expired_time > 0
                          ? formatTimestampToDateOnly(apiKey.expired_time)
                          : t("Never")}
                      </TableCell>
                      <TableCell className="text-right">
                        <ApiKeyRowActions apiKey={apiKey} />
                      </TableCell>
                    </TableRow>
                  );
                })
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
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-full text-xs"
          onClick={handleBatchCopy}
          disabled={batchCopying}
        >
          {batchCopying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
          {t("Copy")}
        </Button>
      </BulkActions>

      <ConfirmDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        title={t("Delete selected API keys?")}
        description={t("This action cannot be undone.")}
        confirmText={t("Delete")}
        cancelText={t("Cancel")}
        variant="destructive"
        onConfirm={async () => {
          const result = await batchDeleteApiKeys(Array.from(selected));
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
