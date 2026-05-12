"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShieldCheck, ExternalLink, RefreshCw, Copy, Loader2, KeySquare } from "lucide-react";
import { completeCodexOAuth, getCodexUsage, startCodexOAuth } from "./api";

type Phase = "idle" | "started" | "complete" | "error";

interface CodexOAuthDialogProps {
  channelId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CodexOAuthDialog({ channelId, open, onOpenChange }: CodexOAuthDialogProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("idle");
  const [authUrl, setAuthUrl] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setPhase("idle");
    setAuthUrl("");
    setCallbackUrl("");
    setStatusInfo(null);
  };

  useEffect(() => {
    if (!open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startOAuth = async () => {
    if (channelId == null) return;
    setBusy(true);
    try {
      const res = await startCodexOAuth();
      if (res.success !== false) {
        const url =
          res.data?.authorize_url ??
          "";
        if (!url) {
          toast.error("No auth URL returned");
          setPhase("error");
        } else {
          setAuthUrl(url);
          setPhase("started");
          toast.success("OAuth flow started");
        }
      } else {
        toast.error(res.message || t("common.error"));
        setPhase("error");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
      setPhase("error");
    } finally {
      setBusy(false);
    }
  };

  const checkStatus = async (silent = false) => {
    if (channelId == null) return;
    if (!silent) setBusy(true);
    try {
      if (callbackUrl.trim()) {
        const res = await completeCodexOAuth(callbackUrl.trim());
        const data = res.data ?? {};
        setStatusInfo(data);
        if (res.success !== false) {
          setPhase("complete");
          toast.success("OAuth complete. Credential generated.");
        } else {
          toast.error(res.message || t("common.error"));
        }
        return;
      }

      const res = await getCodexUsage(channelId);
      setStatusInfo(res.data ?? res);
      if (!silent) {
        toast.info(res.success === false ? res.message || t("common.error") : "Usage refreshed");
      }
    } catch (err: any) {
      if (!silent) toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      if (!silent) setBusy(false);
    }
  };

  const openExternal = () => {
    if (!authUrl) return;
    window.open(authUrl, "_blank", "noopener,noreferrer");
  };

  const copyUrl = () => {
    if (!authUrl) return;
    navigator.clipboard.writeText(authUrl).catch(() => {});
    toast.success("URL copied");
  };

  const phaseBadge = () => {
    switch (phase) {
      case "idle":
        return <Badge variant="secondary">Not started</Badge>;
      case "started":
        return <Badge variant="secondary">URL ready</Badge>;
      case "complete":
        return <Badge variant="success">Complete</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Codex OAuth
          </DialogTitle>
          <DialogDescription>
            Channel #{channelId ?? "—"} · {phaseBadge()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <ol className="text-xs text-[var(--muted)] list-decimal pl-4 space-y-1">
            <li>Click “Start OAuth” to generate an authorization URL.</li>
            <li>Open the URL in a new tab and complete authentication.</li>
            <li>Paste the redirected callback URL below and generate the credential.</li>
          </ol>

          {authUrl && (
            <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--muted)]">Authorization URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-xs font-mono" title={authUrl}>
                  {authUrl}
                </code>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyUrl} title="Copy">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Button size="sm" onClick={openExternal}>
                <ExternalLink className="h-3 w-3 mr-2" />
                Open in new tab
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-[var(--muted)]">Callback URL</p>
            <Input
              value={callbackUrl}
              onChange={(event) => setCallbackUrl(event.target.value)}
              placeholder="Paste the full callback URL"
              disabled={busy}
            />
          </div>

          {statusInfo && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--muted)] mb-2 flex items-center gap-2">
                <KeySquare className="h-3 w-3" />
                Status response
              </p>
              <pre className="text-xs font-mono overflow-auto max-h-[180px]">
                {JSON.stringify(statusInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close") || "Close"}
          </Button>
          {phase === "idle" || phase === "error" ? (
            <Button onClick={startOAuth} disabled={busy}>
              {busy ? (
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-3 w-3 mr-2" />
              )}
              Start OAuth
            </Button>
          ) : (
            <Button onClick={() => checkStatus(false)} disabled={busy}>
              {busy ? (
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-2" />
              )}
              {callbackUrl.trim() ? "Generate credential" : "Refresh usage"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
