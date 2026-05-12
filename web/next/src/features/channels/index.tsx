"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Trash2,
  Play,
  RefreshCw,
  Copy,
  Edit,
  Wallet,
  List,
  Filter,
  MoreHorizontal,
  X,
  KeyRound,
  Server,
  ShieldCheck,
  Tag as TagIcon,
  Wrench,
  Loader2,
} from "lucide-react";
import { CHANNEL_TYPE_OPTIONS } from "./constants";
import {
  batchDeleteChannels,
  copyChannel,
  createChannel,
  deleteChannel,
  fetchUpstreamModels,
  fixChannelAbilities,
  searchChannels,
  testChannel,
  updateChannel,
  updateChannelBalance,
} from "./api";
import { MultiKeyDialog } from "./multi-key-dialog";
import { OllamaDialog } from "./ollama-dialog";
import { CodexOAuthDialog } from "./codex-oauth-dialog";
import { TagOperationsDialog } from "./tag-operations-dialog";
import type { AddChannelRequest, Channel } from "./types";

const CHANNEL_TYPES = CHANNEL_TYPE_OPTIONS;

function channelTypeLabel(v: number): string {
  return CHANNEL_TYPES.find((c) => c.value === v)?.label ?? `Type ${v}`;
}

interface FormState {
  name: string;
  type: number;
  base_url: string;
  key: string;
  models: string;
  groups: string;
  priority: string;
  weight: string;
}

const emptyForm: FormState = {
  name: "",
  type: 1,
  base_url: "",
  key: "",
  models: "",
  groups: "default",
  priority: "0",
  weight: "0",
};

export default function ChannelsPage() {
  const { t } = useTranslation();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Form dialog (create or edit)
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Models dialog
  const [modelsOpen, setModelsOpen] = useState(false);
  const [modelsList, setModelsList] = useState<string[]>([]);
  const [modelsChannelName, setModelsChannelName] = useState("");

  // Advanced dialogs
  const [multiKeyOpen, setMultiKeyOpen] = useState(false);
  const [multiKeyChannelId, setMultiKeyChannelId] = useState<number | null>(null);
  const [ollamaOpen, setOllamaOpen] = useState(false);
  const [ollamaChannelId, setOllamaChannelId] = useState<number | null>(null);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string | undefined>(undefined);
  const [codexOpen, setCodexOpen] = useState(false);
  const [codexChannelId, setCodexChannelId] = useState<number | null>(null);
  const [tagOpsOpen, setTagOpsOpen] = useState(false);
  const [fixingAbilities, setFixingAbilities] = useState(false);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await searchChannels({
        keyword: search || undefined,
        tag: tagFilter || undefined,
        p: 0,
        page_size: 100,
      });
      if (res.data) {
        const list: Channel[] = Array.isArray(res.data)
          ? res.data
          : res.data.items ?? [];
        setChannels(list);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await searchChannels({
        p: 0,
        page_size: 100,
        tag_mode: true,
      });
      if (res.data) {
        const raw = Array.isArray(res.data) ? res.data : res.data.items;
        const list = Array.isArray(raw) ? raw : [];
        const tags = list
          .map((t: any) => (typeof t === "string" ? t : t?.tag ?? t?.name))
          .filter((s: unknown): s is string => typeof s === "string" && s.length > 0);
        setAvailableTags(tags);
      }
    } catch {
      // tags endpoint optional; silently ignore
    }
  };

  useEffect(() => {
    fetchChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tagFilter]);

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Clear selection when dataset changes
    setSelectedIds(new Set());
  }, [channels]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (ch: Channel) => {
    setEditingId(ch.id);
    setForm({
      name: ch.name || "",
      type: ch.type ?? 1,
      base_url: ch.base_url || "",
      key: "",
      models: Array.isArray(ch.models)
        ? (ch.models as unknown as string[]).join(",")
        : ch.models || "",
      groups: Array.isArray(ch.groups) ? ch.groups.join(",") : ch.group || "default",
      priority: String(ch.priority ?? 0),
      weight: String(ch.weight ?? 0),
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const channelPayload: Partial<Channel> = {
        name: form.name,
        type: form.type,
        base_url: form.base_url,
        models: form.models,
        group: form.groups,
        groups: form.groups.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const priorityNum = Number(form.priority);
      if (!Number.isNaN(priorityNum)) channelPayload.priority = priorityNum;
      const weightNum = Number(form.weight);
      if (!Number.isNaN(weightNum)) channelPayload.weight = weightNum;
      if (form.key) channelPayload.key = form.key;

      let res;
      if (editingId != null) {
        res = await updateChannel(editingId, channelPayload);
      } else {
        const payload: AddChannelRequest = {
          mode: "single",
          channel: channelPayload,
        };
        res = await createChannel(payload);
      }
      if (res.success) {
        toast.success(t("common.success"));
        setFormOpen(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchChannels();
      } else {
        toast.error(res.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this channel?")) return;
    try {
      await deleteChannel(id);
      toast.success(t("common.success"));
      fetchChannels();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const handleTest = async (id: number) => {
    try {
      const res = await testChannel(id);
      toast.info(res.message || "Test completed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const handleBalance = async (id: number) => {
    try {
      const res = await updateChannelBalance(id);
      if (res.success) {
        const balance = res.balance ?? (res as any).data?.balance;
        toast.success(
          balance != null
            ? `Balance: $${Number(balance).toFixed(2)}`
            : res.message || t("common.success"),
        );
        fetchChannels();
      } else {
        toast.error(res.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const handleFetchModels = async (ch: Channel) => {
    try {
      const res = await fetchUpstreamModels(ch.id);
      if (res.success) {
        const raw = res.data ?? [];
        const list: string[] = Array.isArray(raw)
          ? raw.map((m: any) => (typeof m === "string" ? m : m?.id ?? String(m)))
          : [];
        setModelsList(list);
        setModelsChannelName(ch.name);
        setModelsOpen(true);
      } else {
        toast.error(res.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const handleCopy = async (id: number) => {
    try {
      const res = await copyChannel(id);
      if (res.success) {
        toast.success(t("common.success"));
        fetchChannels();
      } else {
        toast.error(res.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const handleFixAbilities = async () => {
    setFixingAbilities(true);
    try {
      const res = await fixChannelAbilities();
      if (res.success !== false) {
        const n = (res.data as any)?.fixed ?? (res.data as any)?.count;
        toast.success(
          typeof n === "number"
            ? `Abilities fixed · ${n}`
            : res.message || t("common.success"),
        );
      } else {
        toast.error(res.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setFixingAbilities(false);
    }
  };

  const openMultiKey = (ch: Channel) => {
    setMultiKeyChannelId(ch.id);
    setMultiKeyOpen(true);
  };

  const openOllama = (ch: Channel) => {
    setOllamaChannelId(ch.id);
    setOllamaBaseUrl(ch.base_url ?? undefined);
    setOllamaOpen(true);
  };

  const openCodex = (ch: Channel) => {
    setCodexChannelId(ch.id);
    setCodexOpen(true);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} channel(s)?`)) return;
    try {
      const res = await batchDeleteChannels({
        ids: Array.from(selectedIds),
      });
      if (res.success) {
        toast.success(t("common.success"));
        setSelectedIds(new Set());
        fetchChannels();
      } else {
        toast.error(res.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === channels.length && channels.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(channels.map((c) => c.id)));
    }
  };

  const allSelected = useMemo(
    () => channels.length > 0 && selectedIds.size === channels.length,
    [channels.length, selectedIds.size],
  );

  const statusColors: Record<number, "success" | "destructive" | "secondary"> = {
    1: "success",
    2: "destructive",
    3: "secondary",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("nav.channels")}</h1>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-[var(--destructive)] border-[var(--destructive)]/40"
              onClick={handleBatchDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchChannels}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("common.refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTagOpsOpen(true)}>
            <TagIcon className="h-4 w-4 mr-2" />
            Tag ops
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFixAbilities}
            disabled={fixingAbilities}
          >
            {fixingAbilities ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wrench className="h-4 w-4 mr-2" />
            )}
            Fix abilities
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t("common.create")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <Input
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {tagFilter ? `Tag: ${tagFilter}` : "All tags"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px]">
            <DropdownMenuLabel>Filter by tag</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTagFilter("")}>All tags</DropdownMenuItem>
            {availableTags.length === 0 ? (
              <DropdownMenuItem disabled>No tags</DropdownMenuItem>
            ) : (
              availableTags.map((tag) => (
                <DropdownMenuItem key={tag} onClick={() => setTagFilter(tag)}>
                  {tag}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {tagFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTagFilter("")}
            className="text-[var(--muted)]"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded" />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.type")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Models</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-[var(--muted)]">
                    {t("common.noData")}
                  </TableCell>
                </TableRow>
              ) : (
                channels.map((ch) => {
                  const modelsCount = Array.isArray(ch.models)
                    ? (ch.models as unknown as string[]).length
                    : typeof ch.models === "string" && ch.models.length > 0
                      ? ch.models.split(",").filter(Boolean).length
                      : 0;
                  return (
                    <TableRow key={ch.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(ch.id)}
                          onCheckedChange={() => toggleOne(ch.id)}
                          aria-label={`Select row ${ch.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{ch.id}</TableCell>
                      <TableCell className="font-medium">{ch.name}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary">{channelTypeLabel(ch.type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[ch.status] || "secondary"}>
                          {ch.status === 1
                            ? t("common.enabled")
                            : ch.status === 2
                              ? "Disabled"
                              : "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        ${(ch.balance ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-[var(--muted)]">
                        {modelsCount} models
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleTest(ch.id)}
                            title="Test"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleBalance(ch.id)}
                            title="Update balance"
                          >
                            <Wallet className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleFetchModels(ch)}
                            title="Fetch models"
                          >
                            <List className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="More"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(ch)}>
                                <Edit className="h-3 w-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopy(ch.id)}>
                                <Copy className="h-3 w-3 mr-2" />
                                Copy
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openMultiKey(ch)}>
                                <KeyRound className="h-3 w-3 mr-2" />
                                Manage Keys
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openOllama(ch)}>
                                <Server className="h-3 w-3 mr-2" />
                                Ollama tools
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openCodex(ch)}>
                                <ShieldCheck className="h-3 w-3 mr-2" />
                                Codex OAuth
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-[var(--destructive)]"
                                onClick={() => handleDelete(ch.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId != null ? "Edit Channel" : "Create Channel"}
            </DialogTitle>
            <DialogDescription>
              {editingId != null
                ? "Update channel configuration. Leave the API Key blank to keep the existing key."
                : "Configure a new upstream channel."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("common.name")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="OpenAI"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.type")}</Label>
              <Select
                value={String(form.type)}
                onValueChange={(v) => setForm((f) => ({ ...f, type: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={String(ct.value)}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                value={form.base_url}
                onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))}
                placeholder="https://api.openai.com"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key{editingId != null ? " (leave blank to keep)" : ""}</Label>
              <Input
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                type="password"
                placeholder={editingId != null ? "••••••••" : "sk-..."}
              />
            </div>
            <div className="space-y-2">
              <Label>Models</Label>
              <Textarea
                value={form.models}
                onChange={(e) => setForm((f) => ({ ...f, models: e.target.value }))}
                placeholder="gpt-4o,gpt-4o-mini,gpt-4-turbo"
                className="min-h-[80px] font-mono text-xs"
              />
              <p className="text-xs text-[var(--muted)]">Comma-separated list of model IDs.</p>
            </div>
            <div className="space-y-2">
              <Label>Groups</Label>
              <Input
                value={form.groups}
                onChange={(e) => setForm((f) => ({ ...f, groups: e.target.value }))}
                placeholder="default,vip"
              />
              <p className="text-xs text-[var(--muted)]">Comma-separated user groups.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  placeholder="0"
                />
                <p className="text-xs text-[var(--muted)]">Higher picked first.</p>
              </div>
              <div className="space-y-2">
                <Label>Weight</Label>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  placeholder="0"
                />
                <p className="text-xs text-[var(--muted)]">Round-robin weight.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.name}>
              {editingId != null ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fetched models dialog */}
      <Dialog open={modelsOpen} onOpenChange={setModelsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Models · {modelsChannelName}</DialogTitle>
            <DialogDescription>
              {modelsList.length} model{modelsList.length === 1 ? "" : "s"} returned by the upstream provider.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] rounded-md border border-[var(--border)]">
            <div className="p-3 space-y-1">
              {modelsList.length === 0 ? (
                <p className="text-sm text-[var(--muted)] py-8 text-center">No models</p>
              ) : (
                modelsList.map((m) => (
                  <div
                    key={m}
                    className="flex items-center justify-between rounded px-2 py-1.5 text-xs font-mono hover:bg-[var(--surface)]"
                  >
                    <span>{m}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(m).catch(() => {});
                        toast.success("Copied");
                      }}
                      title="Copy"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(modelsList.join(",")).catch(() => {});
                toast.success("All copied as CSV");
              }}
              disabled={modelsList.length === 0}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy all
            </Button>
            <Button onClick={() => setModelsOpen(false)}>{t("common.close") || "Close"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MultiKeyDialog
        channelId={multiKeyChannelId}
        open={multiKeyOpen}
        onOpenChange={(o) => {
          setMultiKeyOpen(o);
          if (!o) setMultiKeyChannelId(null);
        }}
      />

      <OllamaDialog
        channelId={ollamaChannelId}
        baseUrl={ollamaBaseUrl}
        open={ollamaOpen}
        onOpenChange={(o) => {
          setOllamaOpen(o);
          if (!o) {
            setOllamaChannelId(null);
            setOllamaBaseUrl(undefined);
          }
        }}
      />

      <CodexOAuthDialog
        channelId={codexChannelId}
        open={codexOpen}
        onOpenChange={(o) => {
          setCodexOpen(o);
          if (!o) setCodexChannelId(null);
        }}
      />

      <TagOperationsDialog
        open={tagOpsOpen}
        onOpenChange={setTagOpsOpen}
        onSuccess={() => {
          fetchChannels();
          fetchTags();
        }}
      />
    </div>
  );
}
