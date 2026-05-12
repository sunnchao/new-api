"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Server, Download, Trash2, RefreshCw, PackageCheck } from "lucide-react";
import {
  deleteOllamaModel,
  fetchUpstreamModels,
  getOllamaVersion,
} from "./api";

interface OllamaDialogProps {
  channelId: number | null;
  baseUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OllamaModel {
  name: string;
  size?: number;
  modified_at?: string;
  digest?: string;
}

function fmtBytes(n?: number): string {
  if (!n || n <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

export function OllamaDialog({ channelId, baseUrl, open, onOpenChange }: OllamaDialogProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("version");
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [versionLoading, setVersionLoading] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [pullName, setPullName] = useState("");
  const [pullBusy, setPullBusy] = useState(false);

  const checkVersion = async () => {
    if (channelId == null) return;
    setVersionLoading(true);
    try {
      const res = await getOllamaVersion(channelId);
      if (res.success !== false) {
        setVersionInfo(res.data ?? res);
        toast.success("Version check OK");
      } else {
        toast.error(res.message || t("common.error"));
        setVersionInfo({ error: res.message });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || t("common.error");
      toast.error(msg);
      setVersionInfo({ error: msg });
    } finally {
      setVersionLoading(false);
    }
  };

  const fetchModels = async () => {
    if (channelId == null) return;
    setModelsLoading(true);
    try {
      const res = await fetchUpstreamModels(channelId);
      const raw = res.data ?? [];
      const list: OllamaModel[] = Array.isArray(raw)
        ? raw.map((m: any) =>
            typeof m === "string"
              ? { name: m }
              : {
                  name: m?.name ?? m?.model ?? String(m),
                  size: m?.size,
                  modified_at: m?.modified_at,
                  digest: m?.digest,
                },
          )
        : [];
      setModels(list);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setModelsLoading(false);
    }
  };

  const deleteModel = async (name: string) => {
    if (channelId == null) return;
    if (!confirm(`Delete model "${name}"?`)) return;
    try {
      const res = await deleteOllamaModel({
        channel_id: channelId,
        model_name: name,
      });
      if (res.success !== false) {
        toast.success(t("common.success"));
        fetchModels();
      } else {
        toast.error(res.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const pullModel = async () => {
    if (channelId == null || !pullName.trim()) return;
    setPullBusy(true);
    try {
      const res = await fetch("/api/channel/ollama/pull", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: channelId,
          model_name: pullName.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success !== false) {
        toast.success(`Pull started: ${pullName.trim()}`);
        setPullName("");
        fetchModels();
      } else {
        toast.error(data?.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setPullBusy(false);
    }
  };

  useEffect(() => {
    if (open && channelId != null) {
      setTab("version");
      setVersionInfo(null);
      setModels([]);
      setPullName("");
    }
  }, [open, channelId]);

  useEffect(() => {
    if (open && tab === "models" && channelId != null && models.length === 0 && !modelsLoading) {
      fetchModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, open, channelId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Ollama · Channel #{channelId ?? "—"}
          </DialogTitle>
          <DialogDescription>
            {baseUrl ? <span className="font-mono text-xs">{baseUrl}</span> : "Tools for Ollama channel"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="version">Version</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="pull">Pull</TabsTrigger>
          </TabsList>

          <TabsContent value="version" className="space-y-3 pt-3">
            <Button size="sm" onClick={checkVersion} disabled={versionLoading}>
              <RefreshCw className={`h-3 w-3 mr-2 ${versionLoading ? "animate-spin" : ""}`} />
              Check version
            </Button>
            {versionInfo && (
              <pre className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-xs font-mono overflow-auto max-h-[280px]">
                {JSON.stringify(versionInfo, null, 2)}
              </pre>
            )}
          </TabsContent>

          <TabsContent value="models" className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--muted)]">
                {models.length} model{models.length === 1 ? "" : "s"}
              </p>
              <Button variant="outline" size="sm" onClick={fetchModels} disabled={modelsLoading}>
                <RefreshCw className={`h-3 w-3 mr-1 ${modelsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            <ScrollArea className="max-h-[340px] rounded-md border border-[var(--border)]">
              <div className="p-2 space-y-1">
                {modelsLoading ? (
                  <p className="text-sm text-[var(--muted)] py-6 text-center">Loading…</p>
                ) : models.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] py-6 text-center">No models</p>
                ) : (
                  models.map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-[var(--surface)]"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono">{m.name}</span>
                        <span className="text-[10px] text-[var(--muted)]">
                          {fmtBytes(m.size)}
                          {m.modified_at ? ` · ${m.modified_at}` : ""}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-[var(--destructive)]"
                        onClick={() => deleteModel(m.name)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pull" className="space-y-3 pt-3">
            <div className="space-y-2">
              <Label>Model name</Label>
              <Input
                value={pullName}
                onChange={(e) => setPullName(e.target.value)}
                placeholder="llama3.1:8b"
                disabled={pullBusy}
              />
              <p className="text-xs text-[var(--muted)]">
                The Ollama daemon will download the model in the background.
              </p>
            </div>
            <Button size="sm" onClick={pullModel} disabled={pullBusy || !pullName.trim()}>
              {pullBusy ? (
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <Download className="h-3 w-3 mr-2" />
              )}
              Start pull
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <PackageCheck className="h-3 w-3 mr-2" />
            {t("common.close") || "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
