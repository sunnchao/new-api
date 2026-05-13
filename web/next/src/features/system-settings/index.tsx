"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Activity,
  DatabaseZap,
  FileClock,
  Gauge,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  cleanupPerformanceLogs,
  clearChannelAffinityCache,
  clearDiskCache,
  createCustomOAuthProvider,
  deleteCustomOAuthProvider,
  discoverOIDCEndpoints,
  forceGC,
  getChannelAffinityCache,
  getChannelAffinityUsageCache,
  getCustomOAuthProviders,
  getPerformanceLogs,
  getPerformanceStats,
  getSystemNotice,
  getSystemStatus,
  resetPerformanceStats,
  updateCustomOAuthProvider,
} from "./api";
import { emptyProvider, formatBytes, getErrorMessage, slugifyProviderName } from "./lib";
import type {
  CacheStats,
  CustomOAuthProvider,
  PerformanceLogsInfo,
  PerformanceStats,
} from "./types";

export function SystemSettingsEnhancements({
  categoryId,
  sectionId,
}: {
  categoryId: string;
  sectionId: string;
}) {
  if (categoryId === "auth" && sectionId === "custom-oauth") {
    return <CustomOAuthPanel />;
  }
  if (categoryId === "models" && sectionId === "channel-affinity") {
    return <ChannelAffinityPanel />;
  }
  if (categoryId === "operations" && sectionId === "performance") {
    return <PerformancePanel />;
  }
  if (categoryId === "site" && sectionId === "notice") {
    return <StatusNoticePanel />;
  }
  return null;
}

function CustomOAuthPanel() {
  const { t } = useTranslation();
  const [providers, setProviders] = React.useState<CustomOAuthProvider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CustomOAuthProvider | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CustomOAuthProvider | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCustomOAuthProviders();
      if (result.success) setProviders(result.data ?? []);
      else toast.error(result.message || t("Failed to load providers"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("Failed to load providers")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (provider: CustomOAuthProvider) => {
    setEditing(provider);
    setDialogOpen(true);
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteCustomOAuthProvider(deleteTarget.id);
      if (!result.success) throw new Error(result.message || t("Delete failed"));
      toast.success(t("Provider deleted"));
      setDeleteTarget(null);
      void load();
    } catch (error) {
      toast.error(getErrorMessage(error, t("Delete failed")));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
            {t("Custom OAuth Providers")}
          </CardTitle>
          <CardDescription>
            {t("Configure custom OAuth providers for user authentication")}
          </CardDescription>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("Add Provider")}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <PanelSkeleton />
        ) : providers.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-5 w-5" />}
            title={t("No custom OAuth providers")}
            description={t("Create a provider to offer another sign-in method.")}
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t("Add Provider")}
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("Authorization Endpoint")}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {provider.client_id}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {provider.slug}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={provider.enabled ? "success" : "disabled"}
                        label={provider.enabled ? t("common.enabled") : t("common.disabled")}
                      />
                    </TableCell>
                    <TableCell className="max-w-[360px] truncate text-xs">
                      {provider.authorization_endpoint}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(provider)}>
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-[var(--destructive)]"
                            onClick={() => setDeleteTarget(provider)}
                          >
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ProviderDialog
        open={dialogOpen}
        provider={editing}
        onOpenChange={setDialogOpen}
        onSaved={() => {
          setDialogOpen(false);
          setEditing(null);
          void load();
        }}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete provider?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This custom OAuth provider will be removed immediately.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function ProviderDialog({
  open,
  provider,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  provider: CustomOAuthProvider | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = React.useState<CustomOAuthProvider>(emptyProvider());
  const [saving, setSaving] = React.useState(false);
  const [discovering, setDiscovering] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setForm(provider ? { ...emptyProvider(), ...provider, client_secret: "" } : emptyProvider());
  }, [open, provider]);

  const update = <K extends keyof CustomOAuthProvider>(
    key: K,
    value: CustomOAuthProvider[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const discover = async () => {
    if (!form.well_known.trim()) {
      toast.error(t("Well-Known URL is required"));
      return;
    }
    setDiscovering(true);
    try {
      const result = await discoverOIDCEndpoints(form.well_known.trim());
      if (!result.success) throw new Error(result.message || t("Discovery failed"));
      const doc = result.data?.discovery;
      setForm((prev) => ({
        ...prev,
        authorization_endpoint:
          doc?.authorization_endpoint ?? prev.authorization_endpoint,
        token_endpoint: doc?.token_endpoint ?? prev.token_endpoint,
        user_info_endpoint: doc?.userinfo_endpoint ?? prev.user_info_endpoint,
        scopes: doc?.scopes_supported?.slice(0, 6).join(" ") || prev.scopes,
      }));
      toast.success(t("Discovery applied"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("Discovery failed")));
    } finally {
      setDiscovering(false);
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.client_id.trim()) {
      toast.error(t("Name, slug and client ID are required"));
      return;
    }
    if (!provider && !form.client_secret?.trim()) {
      toast.error(t("Client secret is required for new providers"));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug.trim(),
        name: form.name.trim(),
      };
      const result = provider
        ? await updateCustomOAuthProvider(provider.id, payload)
        : await createCustomOAuthProvider(payload);
      if (!result.success) throw new Error(result.message || t("Save failed"));
      toast.success(t("Provider saved"));
      onSaved();
    } catch (error) {
      toast.error(getErrorMessage(error, t("Save failed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {provider ? t("Edit Custom OAuth Provider") : t("Add Custom OAuth Provider")}
          </DialogTitle>
          <DialogDescription>
            {t("Configure endpoints, claims and access behavior.")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[62vh] pr-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={t("common.name")}
              value={form.name}
              onChange={(value) => {
                update("name", value);
                if (!provider && !form.slug) update("slug", slugifyProviderName(value));
              }}
            />
            <TextField label="Slug" value={form.slug} onChange={(value) => update("slug", value)} />
            <TextField label="Icon" value={form.icon} onChange={(value) => update("icon", value)} />
            <div className="flex items-center gap-3 rounded-md border border-[var(--border)] p-3">
              <Switch
                checked={form.enabled}
                onCheckedChange={(checked) => update("enabled", checked)}
              />
              <div>
                <Label>{t("common.enabled")}</Label>
                <p className="text-xs text-[var(--muted)]">
                  {t("Show this provider on the sign-in page")}
                </p>
              </div>
            </div>
            <TextField
              label="Client ID"
              value={form.client_id}
              onChange={(value) => update("client_id", value)}
            />
            <TextField
              label="Client Secret"
              type="password"
              value={form.client_secret ?? ""}
              placeholder={provider ? t("Leave empty to keep unchanged") : ""}
              onChange={(value) => update("client_secret", value)}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label>Well-Known URL</Label>
              <div className="flex gap-2">
                <Input
                  value={form.well_known}
                  placeholder="https://example.com/.well-known/openid-configuration"
                  onChange={(event) => update("well_known", event.target.value)}
                />
                <Button variant="outline" onClick={discover} disabled={discovering}>
                  {discovering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {t("Discover")}
                </Button>
              </div>
            </div>
            <TextField
              label="Authorization Endpoint"
              value={form.authorization_endpoint}
              onChange={(value) => update("authorization_endpoint", value)}
            />
            <TextField
              label="Token Endpoint"
              value={form.token_endpoint}
              onChange={(value) => update("token_endpoint", value)}
            />
            <TextField
              label="User Info Endpoint"
              value={form.user_info_endpoint}
              onChange={(value) => update("user_info_endpoint", value)}
            />
            <TextField label="Scopes" value={form.scopes} onChange={(value) => update("scopes", value)} />
            <TextField
              label="User ID Field"
              value={form.user_id_field}
              onChange={(value) => update("user_id_field", value)}
            />
            <TextField
              label="Username Field"
              value={form.username_field}
              onChange={(value) => update("username_field", value)}
            />
            <TextField
              label="Display Name Field"
              value={form.display_name_field}
              onChange={(value) => update("display_name_field", value)}
            />
            <TextField
              label="Email Field"
              value={form.email_field}
              onChange={(value) => update("email_field", value)}
            />
            <div className="space-y-2">
              <Label>Auth Style</Label>
              <Select
                value={String(form.auth_style)}
                onValueChange={(value) => update("auth_style", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Auto Detect</SelectItem>
                  <SelectItem value="1">Params (in body)</SelectItem>
                  <SelectItem value="2">Header (Basic Auth)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TextField
              label="Access Denied Message"
              value={form.access_denied_message}
              onChange={(value) => update("access_denied_message", value)}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label>Access Policy</Label>
              <Textarea
                value={form.access_policy}
                rows={3}
                className="font-mono text-xs"
                onChange={(event) => update("access_policy", event.target.value)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChannelAffinityPanel() {
  const { t } = useTranslation();
  const [stats, setStats] = React.useState<CacheStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [clearing, setClearing] = React.useState<string | null>(null);
  const [usageQuery, setUsageQuery] = React.useState({
    rule_name: "",
    using_group: "",
    key_hint: "",
    key_fp: "",
  });
  const [usageLoading, setUsageLoading] = React.useState(false);
  const [usageData, setUsageData] = React.useState<unknown>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getChannelAffinityCache();
      if (result.success) setStats(result.data ?? null);
      else toast.error(result.message || t("Failed to load cache stats"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("Failed to load cache stats")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const clear = async (ruleName?: string) => {
    setClearing(ruleName || "__all__");
    try {
      const result = await clearChannelAffinityCache(ruleName);
      if (!result.success) throw new Error(result.message || t("Clear failed"));
      toast.success(
        t("Cleared {{count}} cache entries", {
          count: result.data?.deleted ?? 0,
        }),
      );
      void load();
    } catch (error) {
      toast.error(getErrorMessage(error, t("Clear failed")));
    } finally {
      setClearing(null);
    }
  };

  const lookupUsage = async () => {
    if (!usageQuery.rule_name.trim() || !usageQuery.key_fp.trim()) {
      toast.error(t("Rule name and key fingerprint are required"));
      return;
    }
    setUsageLoading(true);
    try {
      const result = await getChannelAffinityUsageCache(usageQuery);
      if (!result.success) throw new Error(result.message || t("Lookup failed"));
      setUsageData(result.data ?? null);
    } catch (error) {
      toast.error(getErrorMessage(error, t("Lookup failed")));
    } finally {
      setUsageLoading(false);
    }
  };

  const byRule = stats?.by_rule_name ?? {};
  const capacity = stats?.cache_capacity || 0;
  const total = stats?.total || 0;
  const percent = capacity > 0 ? Math.min(100, Math.round((total / capacity) * 100)) : 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <DatabaseZap className="h-5 w-5 text-[var(--accent)]" />
              {t("Channel Affinity Cache")}
            </CardTitle>
            <CardDescription>
              {t("Inspect sticky routing cache usage and clear stale entries.")}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
            {t("common.refresh")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <PanelSkeleton />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label={t("common.status")} value={stats?.enabled ? t("common.enabled") : t("common.disabled")} />
                <Metric label={t("Total")} value={String(total)} />
                <Metric label={t("Capacity")} value={String(capacity || "-")} />
                <Metric label={t("Algorithm")} value={stats?.cache_algo || "-"} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span>{t("Cache utilization")}</span>
                  <span>{percent}%</span>
                </div>
                <Progress value={percent} />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold">{t("Entries by rule")}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={clearing === "__all__" || total === 0}
                  onClick={() => void clear()}
                >
                  {clearing === "__all__" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {t("Clear All")}
                </Button>
              </div>
              {Object.keys(byRule).length === 0 ? (
                <div className="rounded-md border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
                  {t("No cache entries")}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(byRule).map(([rule, count]) => (
                    <div
                      key={rule}
                      className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] p-3"
                    >
                      <div>
                        <div className="font-mono text-sm">{rule}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {count} {t("entries")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={clearing === rule}
                        onClick={() => void clear(rule)}
                      >
                        {clearing === rule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        {t("common.delete")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Usage Cache Lookup")}</CardTitle>
          <CardDescription>
            {t("Query per-key channel affinity usage counters.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <TextField
            label={t("Rule Name")}
            value={usageQuery.rule_name}
            onChange={(value) => setUsageQuery((prev) => ({ ...prev, rule_name: value }))}
          />
          <TextField
            label={t("Using Group")}
            value={usageQuery.using_group}
            onChange={(value) => setUsageQuery((prev) => ({ ...prev, using_group: value }))}
          />
          <TextField
            label={t("Key Hint")}
            value={usageQuery.key_hint}
            onChange={(value) => setUsageQuery((prev) => ({ ...prev, key_hint: value }))}
          />
          <TextField
            label={t("Key Fingerprint")}
            value={usageQuery.key_fp}
            onChange={(value) => setUsageQuery((prev) => ({ ...prev, key_fp: value }))}
          />
          <Button onClick={lookupUsage} disabled={usageLoading} className="w-full">
            {usageLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {t("Lookup")}
          </Button>
          {usageData !== null ? (
            <pre className="max-h-[260px] overflow-auto rounded-md bg-[var(--surface)] p-3 text-xs">
              {JSON.stringify(usageData, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function PerformancePanel() {
  const { t } = useTranslation();
  const [stats, setStats] = React.useState<PerformanceStats | null>(null);
  const [logs, setLogs] = React.useState<PerformanceLogsInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [cleanupMode, setCleanupMode] = React.useState("by_count");
  const [cleanupValue, setCleanupValue] = React.useState(10);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [statsResult, logsResult] = await Promise.all([
        getPerformanceStats(),
        getPerformanceLogs(),
      ]);
      if (statsResult.success) setStats(statsResult.data ?? null);
      if (logsResult.success) setLogs(logsResult.data ?? null);
    } catch (error) {
      toast.error(getErrorMessage(error, t("Failed to load performance data")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (key: string, action: () => Promise<{ success: boolean; message?: string }>) => {
    setActionLoading(key);
    try {
      const result = await action();
      if (!result.success) throw new Error(result.message || t("Action failed"));
      toast.success(result.message || t("Action completed"));
      void load();
    } catch (error) {
      toast.error(getErrorMessage(error, t("Action failed")));
    } finally {
      setActionLoading(null);
    }
  };

  const cleanupLogs = async () => {
    if (!cleanupValue || cleanupValue < 1) {
      toast.error(t("Please enter a valid number"));
      return;
    }
    setActionLoading("logs");
    try {
      const result = await cleanupPerformanceLogs(cleanupMode, cleanupValue);
      if (!result.success) throw new Error(result.message || t("Cleanup failed"));
      toast.success(
        t("Cleaned up {{count}} log files, freed {{size}}", {
          count: result.data?.deleted_count ?? 0,
          size: formatBytes(result.data?.freed_bytes ?? 0),
        }),
      );
      void load();
    } catch (error) {
      toast.error(getErrorMessage(error, t("Cleanup failed")));
    } finally {
      setActionLoading(null);
    }
  };

  const cacheMax = stats?.cache_stats?.disk_cache_max_bytes ?? 0;
  const cacheUsed = stats?.cache_stats?.current_disk_usage_bytes ?? stats?.disk_cache_info?.total_size ?? 0;
  const cachePercent = cacheMax > 0 ? Math.min(100, Math.round((cacheUsed / cacheMax) * 100)) : 0;
  const diskPercent = Math.round(stats?.disk_space_info?.used_percent ?? 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-5 w-5 text-[var(--accent)]" />
              {t("Performance Runtime")}
            </CardTitle>
            <CardDescription>
              {t("Inspect runtime cache, memory, disk and maintenance actions.")}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
            {t("common.refresh")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <PanelSkeleton />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label={t("Memory Alloc")} value={formatBytes(stats?.memory_stats?.alloc)} />
                <Metric label={t("Goroutines")} value={String(stats?.memory_stats?.num_goroutine ?? "-")} />
                <Metric label={t("Disk Cache Files")} value={String(stats?.disk_cache_info?.file_count ?? "-")} />
                <Metric label={t("Container")} value={stats?.config?.is_running_in_container ? t("common.yes") : t("common.no")} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <RuntimeMeter
                  label={t("Disk cache usage")}
                  value={cachePercent}
                  detail={`${formatBytes(cacheUsed)} / ${formatBytes(cacheMax)}`}
                />
                <RuntimeMeter
                  label={t("Disk usage")}
                  value={diskPercent}
                  detail={`${formatBytes(stats?.disk_space_info?.used)} / ${formatBytes(stats?.disk_space_info?.total)}`}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading === "disk"}
                  onClick={() => void runAction("disk", clearDiskCache)}
                >
                  {actionLoading === "disk" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {t("Clear Disk Cache")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading === "reset"}
                  onClick={() => void runAction("reset", resetPerformanceStats)}
                >
                  {actionLoading === "reset" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                  {t("Reset Stats")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading === "gc"}
                  onClick={() => void runAction("gc", forceGC)}
                >
                  {actionLoading === "gc" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
                  {t("Force GC")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileClock className="h-5 w-5 text-[var(--accent)]" />
            {t("Runtime Log Files")}
          </CardTitle>
          <CardDescription>{t("Inspect and clean server log files.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label={t("common.status")} value={logs?.enabled ? t("common.enabled") : t("common.disabled")} />
            <Metric label={t("Files")} value={String(logs?.file_count ?? 0)} />
            <Metric label={t("Total Size")} value={formatBytes(logs?.total_size)} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={cleanupMode} onValueChange={setCleanupMode}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="by_count">{t("Keep newest files")}</SelectItem>
                <SelectItem value="by_days">{t("Delete older than days")}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              value={cleanupValue}
              onChange={(event) => setCleanupValue(Number(event.target.value))}
              className="sm:w-[140px]"
            />
            <Button
              variant="outline"
              disabled={actionLoading === "logs" || !logs?.enabled}
              onClick={() => void cleanupLogs()}
            >
              {actionLoading === "logs" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {t("Cleanup Logs")}
            </Button>
          </div>
          {logs?.files?.length ? (
            <ScrollArea className="max-h-[320px] rounded-md border border-[var(--border)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead>{t("common.amount")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.files.slice(0, 50).map((file) => (
                    <TableRow key={file.name}>
                      <TableCell className="font-mono text-xs">{file.name}</TableCell>
                      <TableCell>{formatBytes(file.size)}</TableCell>
                      <TableCell className="text-xs text-[var(--muted)]">
                        {file.mod_time ? new Date(file.mod_time).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusNoticePanel() {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<Record<string, unknown> | null>(null);
  const [notice, setNotice] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([getSystemStatus(), getSystemNotice()])
      .then(([statusData, noticeData]) => {
        if (cancelled) return;
        setStatus(statusData);
        setNotice(typeof noticeData.data === "string" ? noticeData.data : "");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Alert>
      <Activity className="h-4 w-4" />
      <AlertTitle>{t("Public status preview")}</AlertTitle>
      <AlertDescription>
        {loading ? (
          <Skeleton className="mt-2 h-5 w-72" />
        ) : (
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {t("Version")}: {String(status?.version ?? "-")}
              </Badge>
              <Badge variant="outline">
                {t("System Name")}: {String(status?.system_name ?? "-")}
              </Badge>
            </div>
            <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-3 text-xs">
              {notice || t("No public notice configured")}
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] p-3">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="mt-1 break-words font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

function RuntimeMeter({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="space-y-2 rounded-md border border-[var(--border)] p-3">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono">{value}%</span>
      </div>
      <Progress value={value} />
      <div className="text-xs text-[var(--muted)]">{detail}</div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-md" />
      ))}
    </div>
  );
}
