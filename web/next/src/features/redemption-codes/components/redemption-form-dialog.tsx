"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  createRedemption,
  getAdminSubscriptionPlans,
  getRedemption,
  updateRedemption,
  type SubscriptionPlanOption,
} from "../api";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants";
import {
  REDEMPTION_FORM_DEFAULT_VALUES,
  redemptionFormSchema,
  transformFormDataToPayload,
  transformRedemptionToFormDefaults,
  type RedemptionFormValues,
} from "../lib";
import { REDEMPTION_TYPES } from "../types";
import { useRedemptions } from "./redemptions-provider";
import { Button } from "@/components/ui/button";
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

function getPlanLabel(plan: SubscriptionPlanOption): string {
  const title = plan.title || plan.name || `#${plan.id}`;
  const price = plan.price_amount ?? plan.price;
  return price == null ? title : `${title} (${Number(price).toFixed(2)})`;
}

export function RedemptionFormDialog() {
  const { t } = useTranslation();
  const {
    open,
    setOpen,
    currentRow,
    triggerRefresh,
    setCreatedCodes,
  } = useRedemptions();
  const isOpen = open === "create" || open === "update";
  const isUpdate = open === "update" && Boolean(currentRow);
  const [form, setForm] = React.useState<RedemptionFormValues>(REDEMPTION_FORM_DEFAULT_VALUES);
  const [plans, setPlans] = React.useState<SubscriptionPlanOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    getAdminSubscriptionPlans()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setPlans(res.data);
      })
      .catch(() => {});
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    if (isUpdate && currentRow) {
      let cancelled = false;
      setLoading(true);
      getRedemption(currentRow.id)
        .then((result) => {
          if (cancelled) return;
          if (result.success && result.data) setForm(transformRedemptionToFormDefaults(result.data));
          else {
            toast.error(result.message || t(ERROR_MESSAGES.LOAD_FAILED));
            setForm(transformRedemptionToFormDefaults(currentRow));
          }
        })
        .catch(() => {
          if (!cancelled) setForm(transformRedemptionToFormDefaults(currentRow));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    setForm(REDEMPTION_FORM_DEFAULT_VALUES);
    setLoading(false);
  }, [currentRow, isOpen, isUpdate, t]);

  const patchForm = (patch: Partial<RedemptionFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const close = () => {
    if (!submitting) setOpen(null);
  };

  const handleSubmit = async () => {
    const parsed = redemptionFormSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || t(ERROR_MESSAGES.UNEXPECTED));
      return;
    }

    if (
      parsed.data.type === REDEMPTION_TYPES.SUBSCRIPTION &&
      !parsed.data.subscription_plan_id
    ) {
      toast.error(t("Please select a subscription plan"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = transformFormDataToPayload(parsed.data);
      if (isUpdate && currentRow) {
        const result = await updateRedemption({ ...payload, id: currentRow.id });
        if (result.success) {
          toast.success(t(SUCCESS_MESSAGES.REDEMPTION_UPDATED));
          triggerRefresh();
          setOpen(null);
        } else {
          toast.error(result.message || t(ERROR_MESSAGES.UPDATE_FAILED));
        }
        return;
      }

      const result = await createRedemption(payload);
      if (result.success) {
        const codes = Array.isArray(result.data) ? result.data : [];
        setCreatedCodes(codes);
        toast.success(
          codes.length > 1
            ? t("Successfully created {{count}} redemption codes", { count: codes.length })
            : t(SUCCESS_MESSAGES.REDEMPTION_CREATED),
        );
        triggerRefresh();
        setOpen(null);
      } else {
        toast.error(result.message || t(ERROR_MESSAGES.CREATE_FAILED));
      }
    } catch {
      toast.error(t(ERROR_MESSAGES.UNEXPECTED));
    } finally {
      setSubmitting(false);
    }
  };

  const isSubscription = form.type === REDEMPTION_TYPES.SUBSCRIPTION;

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-hidden p-0">
        <DialogHeader className="border-b border-[var(--border)] px-5 py-4 text-left">
          <DialogTitle>
            {isUpdate ? t("Update Redemption Code") : t("Create Redemption Code")}
          </DialogTitle>
          <DialogDescription>
            {t("Create quota or subscription redemption codes.")}
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
              <div className="space-y-2">
                <Label htmlFor="redemption-name">{t("Name")}</Label>
                <Input
                  id="redemption-name"
                  value={form.name}
                  maxLength={20}
                  onChange={(event) => patchForm({ name: event.target.value })}
                  placeholder={t("Enter a name")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("Redemption content")}</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    patchForm({
                      type: value as RedemptionFormValues["type"],
                      subscription_plan_id:
                        value === REDEMPTION_TYPES.QUOTA ? undefined : form.subscription_plan_id,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={REDEMPTION_TYPES.QUOTA}>{t("Quota")}</SelectItem>
                    <SelectItem value={REDEMPTION_TYPES.SUBSCRIPTION}>
                      {t("Subscription plan")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isSubscription ? (
                <div className="space-y-2">
                  <Label>{t("Subscription plan")}</Label>
                  <Select
                    value={form.subscription_plan_id ? String(form.subscription_plan_id) : undefined}
                    onValueChange={(value) =>
                      patchForm({ subscription_plan_id: Number(value) || undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select subscription plan")} />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={String(plan.id)}>
                          {getPlanLabel(plan)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="redemption-quota">{t("Quota")}</Label>
                  <Input
                    id="redemption-quota"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.quota_dollars ?? 0}
                    onChange={(event) =>
                      patchForm({ quota_dollars: Number(event.target.value) || 0 })
                    }
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="redemption-expiry">{t("Expiration Time")}</Label>
                  <Input
                    id="redemption-expiry"
                    type="datetime-local"
                    value={form.expired_time || ""}
                    onChange={(event) => patchForm({ expired_time: event.target.value })}
                  />
                  <p className="text-xs text-[var(--muted)]">
                    {t("Leave empty for never expires")}
                  </p>
                </div>

                {!isUpdate ? (
                  <div className="space-y-2">
                    <Label htmlFor="redemption-count">{t("Quantity")}</Label>
                    <Input
                      id="redemption-count"
                      type="number"
                      min={1}
                      max={100}
                      value={form.count ?? 1}
                      onChange={(event) =>
                        patchForm({ count: Number(event.target.value) || 1 })
                      }
                    />
                  </div>
                ) : null}
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
