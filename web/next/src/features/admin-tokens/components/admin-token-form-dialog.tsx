"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getAdminToken, createAdminToken, updateAdminToken } from "../api";
import {
  ADMIN_TOKEN_FORM_DEFAULT_VALUES,
  adminTokenFormSchema,
  ADMIN_TOKEN_MJ_MODEL_OPTIONS,
  transformAdminTokenFormDataToPayload,
  transformAdminTokenToFormDefaults,
  type AdminTokenFormValues,
} from "../lib";
import { useAdminTokens } from "./admin-tokens-provider";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/features/keys/constants";
import { getUserModels } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const MJ_MODEL_EMPTY = "__none__";

export function AdminTokenFormDialog() {
  const { t } = useTranslation();
  const { open, setOpen, currentRow, triggerRefresh } = useAdminTokens();
  const isOpen = open === "create" || open === "update";
  const isUpdate = open === "update" && Boolean(currentRow);
  const [form, setForm] = React.useState<AdminTokenFormValues>(ADMIN_TOKEN_FORM_DEFAULT_VALUES);
  const [models, setModels] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    getUserModels()
      .then((res) => Array.isArray(res.data) && setModels(res.data))
      .catch(() => {});
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    if (isUpdate && currentRow) {
      let cancelled = false;
      setLoading(true);
      getAdminToken(currentRow.id)
        .then((result) => {
          if (cancelled) return;
          if (result.success && result.data) setForm(transformAdminTokenToFormDefaults(result.data));
          else {
            toast.error(result.message || t(ERROR_MESSAGES.LOAD_FAILED));
            setForm(transformAdminTokenToFormDefaults(currentRow));
          }
        })
        .catch(() => {
          if (!cancelled) setForm(transformAdminTokenToFormDefaults(currentRow));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    setForm(ADMIN_TOKEN_FORM_DEFAULT_VALUES);
    setLoading(false);
  }, [currentRow, isOpen, isUpdate, t]);

  const patchForm = (patch: Partial<AdminTokenFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const close = () => {
    if (!submitting) setOpen(null);
  };

  const handleSubmit = async () => {
    const parsed = adminTokenFormSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || t(ERROR_MESSAGES.UNEXPECTED));
      return;
    }

    setSubmitting(true);
    try {
      const payload = transformAdminTokenFormDataToPayload(parsed.data);
      const result =
        isUpdate && currentRow
          ? await updateAdminToken({ ...payload, id: currentRow.id })
          : await createAdminToken(payload);

      if (result.success) {
        toast.success(
          t(isUpdate ? SUCCESS_MESSAGES.API_KEY_UPDATED : SUCCESS_MESSAGES.API_KEY_CREATED),
        );
        triggerRefresh();
        setOpen(null);
      } else {
        toast.error(
          result.message ||
            t(isUpdate ? ERROR_MESSAGES.UPDATE_FAILED : ERROR_MESSAGES.CREATE_FAILED),
        );
      }
    } catch {
      toast.error(t(ERROR_MESSAGES.UNEXPECTED));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b border-[var(--border)] px-5 py-4 text-left">
          <DialogTitle>
            {isUpdate ? t("Update Admin Token") : t("Create Admin Token")}
          </DialogTitle>
          <DialogDescription>
            {t("Create or update a user-owned API key from the admin console.")}
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
                  <Label htmlFor="admin-token-user">{t("User ID")}</Label>
                  <Input
                    id="admin-token-user"
                    type="number"
                    min={1}
                    value={form.user_id || ""}
                    onChange={(event) => patchForm({ user_id: Number(event.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-token-name">{t("Token Name")}</Label>
                  <Input
                    id="admin-token-name"
                    value={form.name}
                    onChange={(event) => patchForm({ name: event.target.value })}
                    placeholder={t("Admin API Key")}
                  />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <label className="flex min-h-20 items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]/30 px-4 py-3">
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
                    <Label htmlFor="admin-token-quota">{t("Quota")}</Label>
                    <Input
                      id="admin-token-quota"
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
                  <Label htmlFor="admin-token-expiry">{t("Expires")}</Label>
                  <Input
                    id="admin-token-expiry"
                    type="datetime-local"
                    value={form.expired_time || ""}
                    onChange={(event) => patchForm({ expired_time: event.target.value })}
                  />
                  <p className="text-xs text-[var(--muted)]">
                    {t("Leave empty for no expiration.")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t("Midjourney mode")}</Label>
                  <Select
                    value={form.mj_model || MJ_MODEL_EMPTY}
                    onValueChange={(value) =>
                      patchForm({
                        mj_model:
                          value === MJ_MODEL_EMPTY
                            ? ""
                            : (value as (typeof ADMIN_TOKEN_MJ_MODEL_OPTIONS)[number]),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Default")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MJ_MODEL_EMPTY}>{t("Default")}</SelectItem>
                      {ADMIN_TOKEN_MJ_MODEL_OPTIONS.filter(Boolean).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-token-group">{t("Group")}</Label>
                  <Input
                    id="admin-token-group"
                    value={form.group || ""}
                    onChange={(event) => patchForm({ group: event.target.value })}
                    placeholder={t("Default group")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-token-backup-groups">{t("Backup groups")}</Label>
                  <Input
                    id="admin-token-backup-groups"
                    value={form.backup_group || ""}
                    onChange={(event) => patchForm({ backup_group: event.target.value })}
                    placeholder="group-a,group-b"
                  />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-token-models">{t("Model limits")}</Label>
                  <Textarea
                    id="admin-token-models"
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
                  <Label htmlFor="admin-token-ips">{t("Allowed IPs")}</Label>
                  <Textarea
                    id="admin-token-ips"
                    value={form.allow_ips || ""}
                    onChange={(event) => patchForm({ allow_ips: event.target.value })}
                    placeholder="192.168.1.1"
                    className="min-h-24 font-mono text-xs"
                  />
                </div>
              </section>
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
