"use client";

import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Search, Trash2, RefreshCw, Plus, Edit, AlertTriangle, Download,
  ArrowRight, Check, X as IconX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createModel,
  deleteModel,
  getMissingModels,
  previewUpstreamDiff,
  searchModels,
  syncUpstream,
  updateModel,
  updateModelStatus,
} from "./api";
import type { Model } from "./types";
import { getChannels } from "@/features/channels/api";
import type { Channel } from "@/features/channels/types";

interface ModelFormState {
  model_name: string;
  display_name: string;
  model_type: string;
  prompt_ratio: string;
  completion_ratio: string;
  cache_ratio: string;
  image_ratio: string;
  audio_ratio: string;
  context_length: string;
  max_tokens: string;
  capabilities: string[];
  vendor: string;
  group: string[];
}

const emptyForm: ModelFormState = {
  model_name: "",
  display_name: "",
  model_type: "chat",
  prompt_ratio: "",
  completion_ratio: "",
  cache_ratio: "",
  image_ratio: "",
  audio_ratio: "",
  context_length: "",
  max_tokens: "",
  capabilities: [],
  vendor: "",
  group: [],
};

const capabilityOptions = [
  "text", "vision", "audio", "tools", "function_call", "streaming", "reasoning", "embedding",
];

export default function ModelsPage() {
  const { t } = useTranslation();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // create / edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ModelFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  // missing models
  const [missing, setMissing] = useState<string[]>([]);
  const [missingLoading, setMissingLoading] = useState(false);

  // sync wizard
  const [syncOpen, setSyncOpen] = useState(false);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchModels({
        keyword: search || undefined,
        p: 0,
        page_size: 200,
      });
      const data = res.data;
      if (Array.isArray(data)) setModels(data);
      else if (data?.items) setModels(data.items);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchMissing = useCallback(async () => {
    setMissingLoading(true);
    try {
      const res = await getMissingModels();
      const data = res.data;
      if (Array.isArray(data)) {
        setMissing(data.map((x: any) => (typeof x === "string" ? x : x.model_name || x.name)).filter(Boolean));
      } else {
        setMissing([]);
      }
    } catch {
      setMissing([]);
    } finally {
      setMissingLoading(false);
    }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);
  useEffect(() => { fetchMissing(); }, [fetchMissing]);

  const openCreate = (preset?: Partial<ModelFormState>) => {
    setEditId(null);
    setForm({ ...emptyForm, ...preset });
    setEditOpen(true);
  };

  const openEdit = (m: Model) => {
    setEditId(m.id);
    const caps = Array.isArray(m.capabilities)
      ? m.capabilities
      : typeof m.capabilities === "string" && m.capabilities
      ? m.capabilities.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const group = Array.isArray(m.group)
      ? m.group
      : typeof m.group === "string" && m.group
      ? m.group.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    setForm({
      model_name: m.model_name || "",
      display_name: m.display_name || "",
      model_type: m.model_type || "chat",
      prompt_ratio: m.prompt_ratio?.toString() ?? "",
      completion_ratio: m.completion_ratio?.toString() ?? "",
      cache_ratio: m.cache_ratio?.toString() ?? "",
      image_ratio: m.image_ratio?.toString() ?? "",
      audio_ratio: m.audio_ratio?.toString() ?? "",
      context_length: m.context_length?.toString() ?? "",
      max_tokens: m.max_tokens?.toString() ?? "",
      capabilities: caps,
      vendor: m.vendor || "",
      group,
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.model_name.trim()) {
      toast.error(t("common.required") || "Model name is required");
      return;
    }
    setSaving(true);
    const toNum = (v: string) => (v === "" ? undefined : Number(v));
    const payload: Partial<Model> = {
      model_name: form.model_name.trim(),
      description: form.display_name.trim() || undefined,
      endpoints: form.model_type || undefined,
      tags: form.capabilities.join(","),
      vendor_id: form.vendor ? Number(form.vendor) : undefined,
      status: 1,
    };
    try {
      if (editId) {
        await updateModel({ ...payload, id: editId });
        toast.success(t("common.success"));
      } else {
        await createModel(payload);
        toast.success(t("common.success"));
      }
      setEditOpen(false);
      fetchModels();
      fetchMissing();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number, status: number) => {
    try {
      await updateModelStatus(id, status === 1 ? 0 : 1);
      fetchModels();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete") || "Delete this model?")) return;
    try {
      await deleteModel(id);
      toast.success(t("common.success"));
      fetchModels();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t("nav.models")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSyncOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            {t("models.syncWizard") || "Sync wizard"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchModels}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("common.refresh")}
          </Button>
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="h-4 w-4 mr-2" />
            {t("common.create")}
          </Button>
        </div>
      </div>

      {missing.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            {t("models.missingTitle") || "Missing model definitions"}
            <Badge variant="secondary">{missing.length}</Badge>
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {t("models.missingDesc") ||
                "These models are being used by channels but have no metadata configured."}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {missing.slice(0, 30).map((name) => (
                <button
                  key={name}
                  onClick={() => openCreate({ model_name: name, display_name: name })}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface)]/40 px-2 py-0.5 text-xs font-mono hover:bg-[var(--surface)] transition-colors"
                  title={t("models.createFromMissing") || "Create from missing"}
                >
                  {name}
                </button>
              ))}
              {missing.length > 30 && (
                <span className="text-xs text-[var(--muted)] px-2 py-0.5">
                  +{missing.length - 30}
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
        <Input
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pricing.model")}</TableHead>
                <TableHead>{t("models.type") || "Type"}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("pricing.promptPrice")}</TableHead>
                <TableHead>{t("pricing.completionPrice")}</TableHead>
                <TableHead>{t("models.context") || "Context"}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[var(--muted)]">
                    {t("common.noData")}
                  </TableCell>
                </TableRow>
              ) : (
                models.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-mono text-sm">{m.model_name}</div>
                      {m.display_name && m.display_name !== m.model_name && (
                        <div className="text-xs text-[var(--muted)]">{m.display_name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {m.model_type || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === 1 ? "success" : "secondary"}>
                        {m.status === 1 ? t("common.enabled") : t("common.disabled")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.prompt_ratio ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{m.completion_ratio ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{m.context_length ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggle(m.id, m.status)}>
                          {m.status === 1 ? t("common.disable") : t("common.enable")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--destructive)]"
                          onClick={() => handleDelete(m.id)}
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
        </Card>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? t("common.edit") : t("common.create")} {t("pricing.model")}
            </DialogTitle>
            <DialogDescription>
              {t("models.formDesc") || "Define model metadata, pricing ratios and capabilities."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldText
              label={t("models.name") || "Name"}
              value={form.model_name}
              onChange={(v) => setForm({ ...form, model_name: v })}
              required
            />
            <FieldText
              label={t("models.displayName") || "Display name"}
              value={form.display_name}
              onChange={(v) => setForm({ ...form, display_name: v })}
            />
            <div className="space-y-1.5">
              <Label>{t("models.type") || "Type"}</Label>
              <Select
                value={form.model_type}
                onValueChange={(v) => setForm({ ...form, model_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["chat", "completion", "embedding", "image", "audio", "rerank", "moderation"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FieldText
              label={t("models.vendor") || "Vendor"}
              value={form.vendor}
              onChange={(v) => setForm({ ...form, vendor: v })}
            />
            <FieldText
              label={t("pricing.promptPrice") || "Prompt ratio"}
              value={form.prompt_ratio}
              onChange={(v) => setForm({ ...form, prompt_ratio: v })}
              type="number"
            />
            <FieldText
              label={t("pricing.completionPrice") || "Completion ratio"}
              value={form.completion_ratio}
              onChange={(v) => setForm({ ...form, completion_ratio: v })}
              type="number"
            />
            <FieldText
              label={t("models.cacheRatio") || "Cache ratio"}
              value={form.cache_ratio}
              onChange={(v) => setForm({ ...form, cache_ratio: v })}
              type="number"
            />
            <FieldText
              label={t("models.imageRatio") || "Image ratio"}
              value={form.image_ratio}
              onChange={(v) => setForm({ ...form, image_ratio: v })}
              type="number"
            />
            <FieldText
              label={t("models.audioRatio") || "Audio ratio"}
              value={form.audio_ratio}
              onChange={(v) => setForm({ ...form, audio_ratio: v })}
              type="number"
            />
            <FieldText
              label={t("models.contextLength") || "Context length"}
              value={form.context_length}
              onChange={(v) => setForm({ ...form, context_length: v })}
              type="number"
            />
            <FieldText
              label={t("models.maxTokens") || "Max tokens"}
              value={form.max_tokens}
              onChange={(v) => setForm({ ...form, max_tokens: v })}
              type="number"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("models.capabilities") || "Capabilities"}</Label>
            <div className="flex flex-wrap gap-1.5">
              {capabilityOptions.map((cap) => {
                const on = form.capabilities.includes(cap);
                return (
                  <button
                    key={cap}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        capabilities: on
                          ? form.capabilities.filter((c) => c !== cap)
                          : [...form.capabilities, cap],
                      })
                    }
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                      on
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {on && <Check className="inline h-3 w-3 mr-0.5" />}
                    {cap}
                  </button>
                );
              })}
            </div>
          </div>

          <TagInput
            label={t("models.groups") || "Groups"}
            value={form.group}
            onChange={(v) => setForm({ ...form, group: v })}
            placeholder={t("models.groupsHint") || "Type and press Enter"}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SyncWizard open={syncOpen} onOpenChange={setSyncOpen} onApplied={() => { fetchModels(); fetchMissing(); }} />
    </div>
  );
}

function FieldText({
  label, value, onChange, required, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-[var(--destructive)] ml-0.5">*</span>}
      </Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TagInput({
  label, value, onChange, placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 min-h-9">
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--surface)] px-2 py-0.5 text-xs"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== v))}
              className="text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <IconX className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={add}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[6rem] bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Sync wizard
// ────────────────────────────────────────

interface SyncDiffItem {
  model_name?: string;
  name?: string;
  [key: string]: unknown;
}

interface SyncDiff {
  new?: SyncDiffItem[];
  updated?: SyncDiffItem[];
  removed?: SyncDiffItem[];
  missing?: SyncDiffItem[];
  conflicts?: SyncDiffItem[];
}

function SyncWizard({
  open, onOpenChange, onApplied,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApplied: () => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"channel" | "preview" | "apply">("channel");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState<string>("");
  const [diff, setDiff] = useState<SyncDiff>({});
  const [selectedNew, setSelectedNew] = useState<Set<string>>(new Set());
  const [selectedUpdated, setSelectedUpdated] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("channel");
    setDiff({});
    setSelectedNew(new Set());
    setSelectedUpdated(new Set());
    getChannels({ p: 0, page_size: 500 }).then((res) => {
      const list = res.data?.items || [];
      setChannels(Array.isArray(list) ? list : []);
    }).catch(() => setChannels([]));
  }, [open]);

  const loadPreview = async () => {
    if (!channelId) {
      toast.error(t("models.selectChannel") || "Select a channel first");
      return;
    }
    setLoading(true);
    try {
      const res = await previewUpstreamDiff();
      const raw = res.data || {};
      const d: SyncDiff = {
        ...raw,
        new: raw.missing || [],
        updated: raw.conflicts || [],
      };
      setDiff(d);
      const newKeys = new Set<string>((d.new || []).map((x) => x.model_name || x.name || "").filter(Boolean));
      const updKeys = new Set<string>((d.updated || []).map((x) => x.model_name || x.name || "").filter(Boolean));
      setSelectedNew(newKeys);
      setSelectedUpdated(updKeys);
      setStep("preview");
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    setApplying(true);
    try {
      await syncUpstream();
      toast.success(t("common.success"));
      setStep("apply");
      onApplied();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setApplying(false);
    }
  };

  const toggle = (set: Set<string>, key: string, setFn: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setFn(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("models.syncWizard") || "Upstream sync wizard"}</DialogTitle>
          <DialogDescription>
            {t("models.syncWizardDesc") ||
              "Pull model definitions (pricing, context, capabilities) from an upstream channel."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(v) => setStep(v as any)}>
          <TabsList>
            <TabsTrigger value="channel">1. {t("models.channel") || "Channel"}</TabsTrigger>
            <TabsTrigger value="preview" disabled={!diff.new && !diff.updated}>
              2. {t("models.preview") || "Preview"}
            </TabsTrigger>
            <TabsTrigger value="apply" disabled>
              3. {t("models.done") || "Done"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channel" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label>{t("models.channel") || "Channel"}</Label>
              <Select value={channelId} onValueChange={setChannelId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("models.selectChannel") || "Select a channel"} />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      #{c.id} — {c.name} {c.type ? `(${c.type})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={loadPreview} disabled={loading || !channelId}>
                {loading ? t("common.loading") : (
                  <>
                    {t("models.loadDiff") || "Load diff"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 pt-4">
            <DiffSection
              title={t("models.newModels") || "New"}
              tone="new"
              items={diff.new || []}
              selected={selectedNew}
              onToggle={(k) => toggle(selectedNew, k, setSelectedNew)}
            />
            <DiffSection
              title={t("models.updatedModels") || "Updated"}
              tone="updated"
              items={diff.updated || []}
              selected={selectedUpdated}
              onToggle={(k) => toggle(selectedUpdated, k, setSelectedUpdated)}
            />
            <DiffSection
              title={t("models.removedModels") || "Removed"}
              tone="removed"
              items={diff.removed || []}
              readOnly
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("channel")}>
                {t("common.back") || "Back"}
              </Button>
              <Button onClick={apply} disabled={applying}>
                {applying ? t("common.saving") : t("models.applySync") || "Apply sync"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="apply" className="space-y-4 pt-4">
            <div className="flex flex-col items-center text-center py-6 gap-2">
              <div className="h-12 w-12 rounded-full bg-[var(--accent)]/15 flex items-center justify-center">
                <Check className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <p className="text-sm font-medium">{t("models.syncApplied") || "Sync applied"}</p>
              <p className="text-xs text-[var(--muted)]">
                {t("models.syncAppliedDesc") || "Models have been imported/updated."}
              </p>
              <Button onClick={() => onOpenChange(false)}>{t("common.close") || "Close"}</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function DiffSection({
  title, items, tone, selected, onToggle, readOnly,
}: {
  title: string;
  items: any[];
  tone: "new" | "updated" | "removed";
  selected?: Set<string>;
  onToggle?: (k: string) => void;
  readOnly?: boolean;
}) {
  const toneClasses = {
    new: "border-emerald-500/40 bg-emerald-500/5",
    updated: "border-amber-500/40 bg-amber-500/5",
    removed: "border-rose-500/40 bg-rose-500/5",
  }[tone];

  if (!items || items.length === 0) return null;
  return (
    <div className={cn("rounded-md border p-3 space-y-2", toneClasses)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it: any) => {
          const key = it.model_name || it.name || JSON.stringify(it);
          const on = selected?.has(key);
          return (
            <button
              key={key}
              type="button"
              disabled={readOnly}
              onClick={() => onToggle?.(key)}
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-mono transition-colors",
                readOnly
                  ? "border-[var(--border)] opacity-70 cursor-default"
                  : on
                  ? "border-[var(--accent)] bg-[var(--accent)]/15"
                  : "border-[var(--border)] bg-[var(--background)]"
              )}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
