"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Ban, CheckCircle2, RefreshCw, KeyRound } from "lucide-react";
import { getMultiKeyStatus, manageMultiKeys, updateChannel } from "./api";

interface KeyEntry {
  index: number;
  key: string;
  status: number;
  balance?: number;
  last_used?: number;
  error?: string;
}

interface MultiKeyDialogProps {
  channelId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MultiKeyDialog({ channelId, open, onOpenChange }: MultiKeyDialogProps) {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<KeyEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newKeys, setNewKeys] = useState("");

  const normalizeKeys = (data: unknown): KeyEntry[] => {
    if (!data) return [];
    const arr = Array.isArray(data)
      ? data
      : Array.isArray((data as any).keys)
        ? (data as any).keys
        : Array.isArray((data as any).items)
          ? (data as any).items
          : [];
    return arr.map((k: any, i: number) => ({
      index: k?.index ?? i,
      key: typeof k === "string" ? k : k?.key ?? "",
      status: k?.status ?? 1,
      balance: k?.balance,
      last_used: k?.last_used,
      error: k?.error,
    }));
  };

  const fetchKeys = async () => {
    if (channelId == null) return;
    setLoading(true);
    try {
      const res = await getMultiKeyStatus(channelId);
      if (res.success === false) {
        toast.error(res.message || t("common.error"));
      } else {
        setKeys(normalizeKeys(res.data ?? res));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && channelId != null) {
      fetchKeys();
    } else {
      setKeys([]);
      setNewKeys("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, channelId]);

  const perform = async (
    action: "add" | "delete" | "disable" | "enable",
    payload: Record<string, unknown>,
  ) => {
    if (channelId == null) return;
    setBusy(true);
    try {
      const res =
        action === "add"
          ? await updateChannel(channelId, {
              key: (payload.keys as string[]).join("\n"),
              key_mode: "append",
            })
          : await manageMultiKeys({
              channel_id: channelId,
              action:
                action === "delete"
                  ? "delete_key"
                  : action === "disable"
                    ? "disable_key"
                    : "enable_key",
              key_index: payload.key_index as number,
            });
      if (res.success !== false) {
        toast.success(t("common.success"));
        await fetchKeys();
        if (action === "add") setNewKeys("");
      } else {
        toast.error(res.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () => {
    const list = newKeys
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) {
      toast.error("Enter at least one key");
      return;
    }
    perform("add", { keys: list });
  };

  const mask = (k: string) => {
    if (!k) return "—";
    if (k.length <= 12) return k;
    return `${k.slice(0, 6)}…${k.slice(-4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Manage Keys
          </DialogTitle>
          <DialogDescription>
            Channel #{channelId ?? "—"} · {keys.length} key{keys.length === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
            <Label className="text-xs">Add keys (one per line or comma-separated)</Label>
            <Textarea
              value={newKeys}
              onChange={(e) => setNewKeys(e.target.value)}
              placeholder="sk-aaa...&#10;sk-bbb..."
              className="min-h-[72px] font-mono text-xs"
              disabled={busy}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={fetchKeys} disabled={loading || busy}>
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={busy || !newKeys.trim()}>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-[45vh] rounded-md border border-[var(--border)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-[var(--muted)]">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : keys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-[var(--muted)]">
                      No keys
                    </TableCell>
                  </TableRow>
                ) : (
                  keys.map((k) => (
                    <TableRow key={`${k.index}-${k.key}`}>
                      <TableCell className="font-mono text-xs">{k.index}</TableCell>
                      <TableCell className="font-mono text-xs">{mask(k.key)}</TableCell>
                      <TableCell>
                        <Badge variant={k.status === 1 ? "success" : "secondary"}>
                          {k.status === 1 ? t("common.enabled") : "Disabled"}
                        </Badge>
                        {k.error && (
                          <span className="ml-2 text-xs text-[var(--destructive)]">{k.error}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {k.status === 1 ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => perform("disable", { key_index: k.index })}
                              disabled={busy}
                              title="Disable"
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => perform("enable", { key_index: k.index })}
                              disabled={busy}
                              title="Enable"
                            >
                              <CheckCircle2 className="h-3 w-3 text-[var(--success)]" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[var(--destructive)]"
                            onClick={() => perform("delete", { key_index: k.index })}
                            disabled={busy}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close") || "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
