"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2, Zap, RefreshCw, Plus, Trash2, Edit, FileText, Clock,
  Boxes, Container, Layers, Database, ListChecks, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createPrefillGroup,
  createVendor,
  deletePrefillGroup,
  deleteVendor,
  getPrefillGroups,
  getVendors,
  syncUpstream,
  updatePrefillGroup,
  updateVendor,
} from "./api";

type SectionKey = "metadata" | "vendors" | "deployments" | "prefill-groups" | "sync";

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: React.ElementType;
  render: () => React.ReactNode;
}

export default function ModelsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = use(params);
  const { t } = useTranslation();

  const sections: SectionDef[] = [
    { key: "metadata", label: t("models.section.metadata") || "Metadata", icon: Database, render: () => <MetadataRedirect /> },
    { key: "vendors", label: t("models.section.vendors") || "Vendors", icon: Building2, render: () => <Vendors /> },
    { key: "deployments", label: t("models.section.deployments") || "Deployments", icon: Zap, render: () => <Deployments /> },
    { key: "prefill-groups", label: t("models.section.prefillGroups") || "Prefill groups", icon: Layers, render: () => <PrefillGroups /> },
    { key: "sync", label: t("models.section.sync") || "Upstream sync", icon: RefreshCw, render: () => <UpstreamSync /> },
  ];

  const current = sections.find((s) => s.key === section) ?? sections[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("nav.models")}</h1>

      <nav className="flex gap-1 overflow-x-auto border-b border-[var(--border)] pb-0 -mx-1 px-1">
        {sections.map((s) => {
          const Icon = s.icon;
          const active = section === s.key;
          return (
            <Link
              key={s.key}
              href={`/models/${s.key}`}
              className={cn(
                "group inline-flex items-center gap-2 rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                active
                  ? "border-[var(--accent)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-[var(--accent)]" : "text-[var(--muted)]")} />
              {s.label}
            </Link>
          );
        })}
      </nav>

      {current.render()}
    </div>
  );
}

// ──────────────────────────────────────────
// Metadata — redirect hint
// ──────────────────────────────────────────
function MetadataRedirect() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-3">
        <Database className="h-8 w-8 mx-auto text-[var(--muted)]" />
        <p className="text-sm text-[var(--muted)]">
          {t("models.metadataRedirect") ||
            "Model metadata management lives on the main Models page."}
        </p>
        <Link href="/models" className="text-sm text-[var(--accent)] hover:underline">
          {t("models.goToMain") || "Go to Models"}
        </Link>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────
// Vendors CRUD
// ──────────────────────────────────────────
interface Vendor {
  id: number;
  name: string;
  icon_url?: string;
  description?: string;
  status: number;
}

function Vendors() {
  const { t } = useTranslation();
  const [list, setList] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Vendor>({ id: 0, name: "", icon_url: "", description: "", status: 1 });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVendors();
      const data = res.data;
      setList(Array.isArray(data) ? data : data?.items || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const openCreate = () => {
    setForm({ id: 0, name: "", icon_url: "", description: "", status: 1 });
    setEditOpen(true);
  };
  const openEdit = (v: Vendor) => { setForm(v); setEditOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error(t("common.required") || "Name required"); return; }
    setSaving(true);
    try {
      if (form.id) await updateVendor(form);
      else await createVendor(form);
      toast.success(t("common.success"));
      setEditOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm(t("common.confirmDelete") || "Delete?")) return;
    try {
      await deleteVendor(id);
      toast.success(t("common.success"));
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--accent)]" />
            {t("models.section.vendors") || "Vendors"}
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />{t("common.create")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : list.length === 0 ? (
          <p className="text-center py-8 text-[var(--muted)]">{t("common.noData")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.description") || "Description"}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">{v.id}</TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    {v.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.icon_url} alt="" className="h-5 w-5 rounded" />
                    ) : (
                      <Building2 className="h-4 w-4 text-[var(--muted)]" />
                    )}
                    {v.name}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--muted)] max-w-md truncate">{v.description || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === 1 ? "success" : "secondary"}>
                      {v.status === 1 ? t("common.enabled") : t("common.disabled")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--destructive)]" onClick={() => remove(v.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? t("common.edit") : t("common.create")} Vendor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("common.name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Icon URL</Label>
              <Input value={form.icon_url || ""} onChange={(e) => setForm({ ...form, icon_url: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.description") || "Description"}</Label>
              <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.status")}</Label>
              <Select value={String(form.status)} onValueChange={(v) => setForm({ ...form, status: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("common.enabled")}</SelectItem>
                  <SelectItem value="0">{t("common.disabled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>{t("common.cancel")}</Button>
            <Button onClick={save} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ──────────────────────────────────────────
// Deployments (io.net) CRUD
// ──────────────────────────────────────────
interface Deployment {
  id: number | string;
  name: string;
  model_name?: string;
  hardware_type?: string;
  location?: string;
  status?: string;
  replicas?: number;
  created_at?: string;
  expires_at?: string;
}

function Deployments() {
  const { t } = useTranslation();
  const [list, setList] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<any>(null);
  const [hardwareTypes, setHardwareTypes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [replicas, setReplicas] = useState<any>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [containersOpen, setContainersOpen] = useState(false);
  const [active, setActive] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<string>("");
  const [containers, setContainers] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    model_name: "",
    hardware_type: "",
    location: "",
    replicas: 1,
    duration_days: 1,
  });
  const [priceEst, setPriceEst] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/deployments/list");
      const data = res.data?.data;
      setList(Array.isArray(data) ? data : data?.items || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    const fetchers = [
      api.get("/api/deployments/settings").then((r) => setSettings(r.data?.data)).catch(() => {}),
      api.get("/api/deployments/hardware-types").then((r) => {
        const d = r.data?.data;
        setHardwareTypes(Array.isArray(d) ? d : d?.items || []);
      }).catch(() => {}),
      api.get("/api/deployments/locations").then((r) => {
        const d = r.data?.data;
        setLocations(Array.isArray(d) ? d : d?.items || []);
      }).catch(() => {}),
      api.get("/api/deployments/available-replicas").then((r) => setReplicas(r.data?.data)).catch(() => {}),
    ];
    await Promise.all(fetchers);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openCreate = async () => {
    await loadConfig();
    setForm({ name: "", model_name: "", hardware_type: "", location: "", replicas: 1, duration_days: 1 });
    setPriceEst(null);
    setCreateOpen(true);
  };

  const estimatePrice = async () => {
    if (!form.hardware_type) return;
    try {
      const res = await api.get("/api/deployments/price-estimation", {
        params: {
          hardware_type: form.hardware_type,
          location: form.location,
          replicas: form.replicas,
          duration_days: form.duration_days,
        },
      });
      setPriceEst(res.data?.data);
    } catch {
      setPriceEst(null);
    }
  };

  useEffect(() => { estimatePrice(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.hardware_type, form.location, form.replicas, form.duration_days]);

  const create = async () => {
    if (!form.name.trim() || !form.hardware_type) {
      toast.error(t("common.required") || "Name and hardware required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/deployments/", form);
      toast.success(t("common.success"));
      setCreateOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  };

  const extend = async (d: Deployment) => {
    const days = prompt(t("deployments.extendDaysPrompt") || "Extend by how many days?", "1");
    if (!days) return;
    try {
      await api.post(`/api/deployments/${d.id}/extend`, { duration_days: Number(days) });
      toast.success(t("common.success"));
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const remove = async (d: Deployment) => {
    if (!confirm(t("common.confirmDelete") || "Delete this deployment?")) return;
    try {
      await api.delete(`/api/deployments/${d.id}`);
      toast.success(t("common.success"));
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const showLogs = async (d: Deployment) => {
    setActive(d);
    setLogs("");
    setLogsOpen(true);
    try {
      const res = await api.get(`/api/deployments/${d.id}/logs`);
      const data = res.data?.data;
      setLogs(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    } catch (err: any) {
      setLogs(err.response?.data?.message || "Failed to load logs");
    }
  };

  const showContainers = async (d: Deployment) => {
    setActive(d);
    setContainers([]);
    setContainersOpen(true);
    try {
      const res = await api.get(`/api/deployments/${d.id}/containers`);
      const data = res.data?.data;
      setContainers(Array.isArray(data) ? data : data?.items || []);
    } catch {
      setContainers([]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--accent)]" />
            io.net {t("models.section.deployments") || "Deployments"}
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4" /></Button>
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t("common.create")}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-20 rounded" />
        ) : list.length === 0 ? (
          <p className="text-center py-8 text-[var(--muted)]">
            {t("deployments.empty") || "No deployments yet."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("pricing.model") || "Model"}</TableHead>
                <TableHead>{t("deployments.hardware") || "Hardware"}</TableHead>
                <TableHead>{t("deployments.location") || "Location"}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((d) => (
                <TableRow key={String(d.id)}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="font-mono text-xs">{d.model_name || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{d.hardware_type || "—"}</TableCell>
                  <TableCell className="text-xs">{d.location || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "Running" ? "success" : "secondary"}>
                      {d.status || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title={t("deployments.extend") || "Extend"} onClick={() => extend(d)}>
                        <Clock className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title={t("deployments.logs") || "Logs"} onClick={() => showLogs(d)}>
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title={t("deployments.containers") || "Containers"} onClick={() => showContainers(d)}>
                        <Container className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--destructive)]" onClick={() => remove(d)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("deployments.create") || "Create deployment"}</DialogTitle>
            <DialogDescription>
              {t("deployments.createDesc") || "Launch an io.net GPU deployment."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label>{t("common.name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>{t("pricing.model") || "Model"}</Label>
              <Input value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })} placeholder="llama-3-70b" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("deployments.hardware") || "Hardware"}</Label>
              <Select value={form.hardware_type} onValueChange={(v) => setForm({ ...form, hardware_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {hardwareTypes.map((h: any) => (
                    <SelectItem key={h.id || h.name} value={String(h.id || h.name)}>
                      {h.name || h.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("deployments.location") || "Location"}</Label>
              <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l: any) => (
                    <SelectItem key={l.id || l.name} value={String(l.id || l.name)}>
                      {l.name || l.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("deployments.replicas") || "Replicas"}</Label>
              <Input
                type="number"
                min={1}
                max={replicas?.max ?? 16}
                value={form.replicas}
                onChange={(e) => setForm({ ...form, replicas: Number(e.target.value) })}
              />
              {replicas?.max && (
                <p className="text-xs text-[var(--muted)]">Max {replicas.max}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("deployments.durationDays") || "Duration (days)"}</Label>
              <Input
                type="number"
                min={1}
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })}
              />
            </div>
          </div>

          {priceEst && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/40 p-3 text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-[var(--muted)]">{t("deployments.priceEstimate") || "Estimated"}:</span>
              <span className="font-mono font-medium">
                {priceEst.total ?? priceEst.price ?? JSON.stringify(priceEst)}
              </span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>{t("common.cancel")}</Button>
            <Button onClick={create} disabled={saving}>{saving ? t("common.saving") : t("common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs dialog */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t("deployments.logs") || "Logs"} — {active?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] rounded-md border border-[var(--border)] bg-[var(--surface)]/40 p-3">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all">{logs || "Loading..."}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Containers dialog */}
      <Dialog open={containersOpen} onOpenChange={setContainersOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t("deployments.containers") || "Containers"} — {active?.name}
            </DialogTitle>
          </DialogHeader>
          {containers.length === 0 ? (
            <p className="text-center py-8 text-[var(--muted)]">{t("common.noData")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.map((c: any) => (
                  <TableRow key={c.id || c.name}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ──────────────────────────────────────────
// Prefill Groups CRUD
// ──────────────────────────────────────────
interface PrefillGroup {
  id: number;
  name: string;
  type?: "model" | "tag" | "endpoint";
  description?: string;
  items?: string[] | string;
  models?: string[] | string;
  status?: number;
}

function PrefillGroups() {
  const { t } = useTranslation();
  const [list, setList] = useState<PrefillGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<{ id: number; name: string; description: string; models: string }>({
    id: 0, name: "", description: "", models: "",
  });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPrefillGroups();
      const d = res.data;
      setList(Array.isArray(d) ? d : []);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const openCreate = () => {
    setForm({ id: 0, name: "", description: "", models: "" });
    setEditOpen(true);
  };
  const openEdit = (g: PrefillGroup) => {
    const rawItems = g.items ?? g.models ?? "";
    const models = Array.isArray(rawItems) ? rawItems.join(",") : rawItems;
    setForm({ id: g.id, name: g.name, description: g.description || "", models });
    setEditOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error(t("common.required") || "Name required"); return; }
    setSaving(true);
    const payload = {
      id: form.id,
      name: form.name.trim(),
      type: "model" as const,
      description: form.description,
      items: form.models.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (form.id) await updatePrefillGroup(payload);
      else await createPrefillGroup(payload);
      toast.success(t("common.success"));
      setEditOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm(t("common.confirmDelete") || "Delete?")) return;
    try {
      await deletePrefillGroup(id);
      toast.success(t("common.success"));
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-[var(--accent)]" />
            {t("models.section.prefillGroups") || "Prefill groups"}
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4" /></Button>
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t("common.create")}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-20 rounded" />
        ) : list.length === 0 ? (
          <p className="text-center py-8 text-[var(--muted)]">{t("common.noData")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.description") || "Description"}</TableHead>
                <TableHead>{t("pricing.model") || "Models"}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-sm text-[var(--muted)] max-w-md truncate">{g.description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(g.items ?? g.models)
                        ? (g.items ?? g.models) as string[]
                        : (g.items ?? g.models ?? "").toString().split(","))
                        .filter(Boolean)
                        .slice(0, 5)
                        .map((m) => (
                          <Badge key={m} variant="secondary" className="font-mono text-[10px]">{m}</Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--destructive)]" onClick={() => remove(g.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? t("common.edit") : t("common.create")} Prefill Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("common.name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.description") || "Description"}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("models.modelsComma") || "Models (comma-separated)"}</Label>
              <Input value={form.models} onChange={(e) => setForm({ ...form, models: e.target.value })} placeholder="gpt-4o, claude-3-5-sonnet" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>{t("common.cancel")}</Button>
            <Button onClick={save} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ──────────────────────────────────────────
// Upstream Sync
// ──────────────────────────────────────────
function UpstreamSync() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/models/sync_upstream/history").catch(() =>
        api.get("/api/ratio_sync/history")
      );
      const d = res.data?.data;
      setHistory(Array.isArray(d) ? d : d?.items || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncUpstream();
      toast.success(t("common.success"));
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[var(--accent)]" />
            {t("models.section.sync") || "Upstream Model Sync"}
          </CardTitle>
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
            {t("models.syncNow") || "Sync from upstream"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--muted)] mb-4 flex items-center gap-2">
          <Info className="h-4 w-4" />
          {t("models.syncInfo") ||
            "Pulls model pricing, context length and capability metadata from configured upstream channels."}
        </p>
        {loading ? (
          <Skeleton className="h-20 rounded" />
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-sm text-[var(--muted)]">
            <ListChecks className="h-5 w-5 mx-auto mb-2 opacity-60" />
            {t("models.noSyncHistory") || "No sync runs recorded yet."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.time") || "Time"}</TableHead>
                <TableHead>{t("models.channel") || "Channel"}</TableHead>
                <TableHead>{t("models.newModels") || "New"}</TableHead>
                <TableHead>{t("models.updatedModels") || "Updated"}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h: any, i: number) => (
                <TableRow key={h.id ?? i}>
                  <TableCell className="font-mono text-xs">
                    {h.created_at || h.time || h.timestamp || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{h.channel_name || h.channel_id || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{h.new_count ?? h.new ?? 0}</TableCell>
                  <TableCell className="font-mono text-xs">{h.updated_count ?? h.updated ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={h.status === "success" || h.success ? "success" : "secondary"}>
                      {h.status || (h.success ? "success" : "—")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
