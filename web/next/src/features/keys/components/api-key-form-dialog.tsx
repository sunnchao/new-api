"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getApiKey, createApiKey, updateApiKey } from "../api";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants";
import {
  API_KEY_FORM_DEFAULT_VALUES,
  apiKeyFormSchema,
  transformApiKeyToFormDefaults,
  transformFormDataToPayload,
  type ApiKeyFormValues,
} from "../lib";
import type { ApiKey } from "../types";
import { useApiKeys } from "./api-keys-provider";
import { getUserGroups, getUserModels } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function mapGroups(data: unknown): string[] {
  if (Array.isArray(data)) return data.filter((item): item is string => typeof item === "string");
  if (data && typeof data === "object") return Object.keys(data as Record<string, unknown>);
  return [];
}

function parseError(error: unknown): string | null {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return null;
}

function makeBatchName(baseName: string, index: number): string {
  if (index === 0) return baseName;
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${baseName || "default"}-${suffix}`;
}

export function ApiKeyFormDialog() {
  const { t } = useTranslation();
  const { open, setOpen, currentRow, triggerRefresh } = useApiKeys();
  const isOpen = open === "create" || open === "update";
  const isUpdate = open === "update" && Boolean(currentRow);
  const [form, setForm] = React.useState<ApiKeyFormValues>(API_KEY_FORM_DEFAULT_VALUES);
  const [groups, setGroups] = React.useState<string[]>([]);
  const [models, setModels] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    getUserGroups()
      .then((res) => {
        if (!cancelled) setGroups(mapGroups(res.data));
      })
      .catch(() => {});
    getUserModels()
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) setModels(res.data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    if (isUpdate && currentRow) {
      let cancelled = false;
      setLoading(true);
      getApiKey(currentRow.id)
        .then((result) => {
          if (cancelled) return;
          if (result.success && result.data) {
            setForm(transformApiKeyToFormDefaults(result.data));
          } else {
            toast.error(result.message || t(ERROR_MESSAGES.LOAD_FAILED));
            setForm(transformApiKeyToFormDefaults(currentRow));
          }
        })
        .catch(() => {
          if (!cancelled) setForm(transformApiKeyToFormDefaults(currentRow));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    setForm({
      ...API_KEY_FORM_DEFAULT_VALUES,
      group: groups[0] || API_KEY_FORM_DEFAULT_VALUES.group,
    });
    setLoading(false);
  }, [currentRow, groups, isOpen, isUpdate, t]);

  const patchForm = (patch: Partial<ApiKeyFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const close = () => {
    if (!submitting) setOpen(null);
  };

  const handleSubmit = async () => {
    const parsed = apiKeyFormSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || t(ERROR_MESSAGES.UNEXPECTED));
      return;
    }

    setSubmitting(true);
    try {
      const payload = transformFormDataToPayload(parsed.data);
      if (isUpdate && currentRow) {
        const result = await updateApiKey({ ...payload, id: currentRow.id });
        if (result.success) {
          toast.success(t(SUCCESS_MESSAGES.API_KEY_UPDATED));
          triggerRefresh();
          setOpen(null);
        } else {
          toast.error(result.message || t(ERROR_MESSAGES.UPDATE_FAILED));
        }
        return;
      }

      const count = Math.max(1, parsed.data.tokenCount || 1);
      let successCount = 0;
      for (let index = 0; index < count; index++) {
        const result = await createApiKey({
          ...payload,
          name: makeBatchName(payload.name, index),
        });
        if (result.success) successCount++;
        else {
          toast.error(result.message || t(ERROR_MESSAGES.CREATE_FAILED));
          break;
        }
      }

      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? t(SUCCESS_MESSAGES.API_KEY_CREATED)
            : t("Successfully created {{count}} API Key(s)", { count: successCount }),
        );
        triggerRefresh();
        setOpen(null);
      }
    } catch (error) {
      toast.error(parseError(error) || t(ERROR_MESSAGES.UNEXPECTED));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b border-[var(--border)] px-5 py-4 text-left">
          <DialogTitle>
            {isUpdate ? t("Update API Key") : t("Create API Key")}
          </DialogTitle>
          <DialogDescription>
            {t("Configure quota, groups, expiration, model limits, and IP restrictions.")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[64vh] space-y-5 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("Loading...")}
            </div>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="api-key-name">{t("Name")}</Label>
                  <Input
                    id="api-key-name"
                    value={form.name}
                    onChange={(event) => patchForm({ name: event.target.value })}
                    placeholder={t("Production API Key")}
                  />
                </div>

                {!isUpdate ? (
                  <div className="space-y-2">
                    <Label htmlFor="api-key-count">{t("Token count")}</Label>
                    <Input
                      id="api-key-count"
                      type="number"
                      min={1}
                      max={100}
                      value={form.tokenCount ?? 1}
                      onChange={(event) =>
                        patchForm({ tokenCount: Number(event.target.value) || 1 })
                      }
                    />
                  </div>
                ) : null}
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <label
                  className={cn(
                    "flex min-h-20 items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]/30 px-4 py-3",
                  )}
                >
                  <span>
                    <span className="block text-sm font-medium">
                      {t("Unlimited quota")}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {t("Disable quota deduction limit for this key.")}
                    </span>
                  </span>
                  <Checkbox
                    checked={form.unlimited_quota}
                    onCheckedChange={(value) => patchForm({ unlimited_quota: Boolean(value) })}
                  />
                </label>

                {!form.unlimited_quota ? (
                  <div className="space-y-2">
                    <Label htmlFor="api-key-quota">{t("Quota")}</Label>
                    <Input
                      id="api-key-quota"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.remain_quota_dollars ?? 0}
                      onChange={(event) =>
                        patchForm({ remain_quota_dollars: Number(event.target.value) || 0 })
                      }
                    />
                  </div>
                ) : null}
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="api-key-expiry">{t("Expires")}</Label>
                  <Input
                    id="api-key-expiry"
                    type="datetime-local"
                    value={form.expired_time || ""}
                    onChange={(event) => patchForm({ expired_time: event.target.value })}
                  />
                  <p className="text-xs text-[var(--muted)]">
                    {t("Leave empty for no expiration.")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key-group">{t("Group")}</Label>
                  <Input
                    id="api-key-group"
                    list="api-key-groups"
                    value={form.group || ""}
                    onChange={(event) => patchForm({ group: event.target.value })}
                    placeholder={t("Default group")}
                  />
                  <datalist id="api-key-groups">
                    {groups.map((group) => (
                      <option key={group} value={group} />
                    ))}
                    <option value="auto" />
                  </datalist>
                </div>
              </section>

              {form.group === "auto" ? (
                <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <Checkbox
                    checked={Boolean(form.cross_group_retry)}
                    onCheckedChange={(value) => patchForm({ cross_group_retry: Boolean(value) })}
                  />
                  <span>{t("Enable cross-group retry")}</span>
                </label>
              ) : null}

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="api-key-models">{t("Model limits")}</Label>
                  <Textarea
                    id="api-key-models"
                    value={form.model_limits || ""}
                    onChange={(event) => patchForm({ model_limits: event.target.value })}
                    placeholder="gpt-4o,claude-3-5-sonnet"
                    className="min-h-24 font-mono text-xs"
                  />
                  {models.length > 0 ? (
                    <p className="text-xs text-[var(--muted)]">
                      {t("Available")}: {models.slice(0, 5).join(", ")}
                      {models.length > 5 ? ` +${models.length - 5}` : ""}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key-ips">{t("Allowed IPs")}</Label>
                  <Textarea
                    id="api-key-ips"
                    value={form.allow_ips || ""}
                    onChange={(event) => patchForm({ allow_ips: event.target.value })}
                    placeholder="192.168.1.1"
                    className="min-h-24 font-mono text-xs"
                  />
                  <p className="text-xs text-[var(--muted)]">
                    {t("One IP per line. Leave empty for no restriction.")}
                  </p>
                </div>
              </section>

              <div className="space-y-2">
                <Label htmlFor="api-key-backup-groups">{t("Backup groups")}</Label>
                <Input
                  id="api-key-backup-groups"
                  value={form.backup_group || ""}
                  onChange={(event) => patchForm({ backup_group: event.target.value })}
                  placeholder="group-a,group-b"
                />
                <p className="text-xs text-[var(--muted)]">
                  {t("Comma-separated fallback groups used when auto group retry is enabled.")}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-[var(--border)] px-5 py-4">
          <Button variant="outline" onClick={close} disabled={submitting}>
            {t("Cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isUpdate ? t("Save") : t("Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
