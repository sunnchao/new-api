"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Sparkles, CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getMyClaudeCodeSubscriptions,
  getClaudeCodePlans,
  purchaseClaudeCodeSubscription,
} from "../api";
import type { VibeCodingSubscription, VibeCodingPlan } from "../api";

export function ClaudeCodeSubscription() {
  const { t } = useTranslation();
  const [mySubscriptions, setMySubscriptions] = useState<VibeCodingSubscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<VibeCodingPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMySubscriptions = async () => {
    setLoading(true);
    try {
      const res = await getMyClaudeCodeSubscriptions();
      if (res.success) {
        setMySubscriptions(res.data || []);
      }
    } catch {
      toast.error(t("Failed to load subscription info"));
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const res = await getClaudeCodePlans();
      if (res.success) {
        setAvailablePlans(res.data || []);
      }
    } catch {
      toast.error(t("Failed to load plans"));
    }
  };

  const handlePurchase = async (planId: number) => {
    try {
      const res = await purchaseClaudeCodeSubscription({ plan_id: planId });
      if (res.success) {
        toast.success(t("Purchase successful"));
        loadMySubscriptions();
      } else {
        toast.error(res.message || t("Purchase failed"));
      }
    } catch {
      toast.error(t("Purchase failed"));
    }
  };

  useEffect(() => {
    loadMySubscriptions();
    loadPlans();
  }, []);

  const hasActiveSubscription = mySubscriptions.some(
    (sub) => sub.status === "active"
  );

  const statusLabel = (status: string) => {
    switch (status) {
      case "active":
        return t("Active");
      case "expired":
        return t("Expired");
      case "cancelled":
        return t("Cancelled");
      default:
        return status;
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default" as const;
      case "expired":
        return "secondary" as const;
      case "cancelled":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Status Banner */}
      <div
        className={`flex items-center gap-3 rounded-lg border p-4 ${
          hasActiveSubscription
            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
            : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
        }`}
      >
        <Sparkles
          className={`h-5 w-5 ${
            hasActiveSubscription
              ? "text-green-600 dark:text-green-400"
              : "text-blue-600 dark:text-blue-400"
          }`}
        />
        <span
          className={`text-sm ${
            hasActiveSubscription
              ? "text-green-800 dark:text-green-200"
              : "text-blue-800 dark:text-blue-200"
          }`}
        >
          {hasActiveSubscription
            ? t("Your Claude Code subscription is active. Enjoy AI programming!")
            : t("Subscribe to Claude Code to unlock smart programming")}
        </span>
      </div>

      {/* Subscription Flow (when no active subscription) */}
      {!hasActiveSubscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-orange-500 to-red-500" />
              <CardTitle>{t("Subscription Flow")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3 rounded-lg bg-[var(--surface)] p-4">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">{t("Choose Plan")}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {t("Browse and select a plan")}
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-lg bg-[var(--surface)] p-4">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">{t("Confirm Payment")}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {t("Complete the payment")}
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-lg bg-[var(--surface)] p-4">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="font-medium">{t("Activate Now")}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {t("Auto-activate, use immediately")}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Subscriptions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-500 to-purple-600" />
            <CardTitle>{t("My Subscriptions")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {mySubscriptions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Plan Type")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Start Time")}</TableHead>
                  <TableHead>{t("End Time")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mySubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Badge variant="secondary">{sub.plan_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(sub.status)}>
                        {statusLabel(sub.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(sub.start_time * 1000).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(sub.end_time * 1000).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-[var(--muted)]">
              {loading ? t("Loading...") : t("No subscriptions yet")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      {availablePlans.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-green-500 to-emerald-600" />
              <CardTitle>{t("Available Plans")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-xl p-6 transition-all hover:scale-105 ${
                    plan.recommended
                      ? "border-2 border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border border-[var(--border)] bg-[var(--surface)]"
                  }`}
                >
                  {plan.recommended && (
                    <Badge className="mb-3">{t("Recommended")}</Badge>
                  )}
                  <h4 className="mb-2 text-lg font-semibold">{plan.name}</h4>
                  <div className="mb-4 text-3xl font-bold text-[var(--accent)]">
                    ¥{plan.price}
                    <span className="text-base font-normal text-[var(--muted)]">
                      /{plan.duration_days}{t("days")}
                    </span>
                  </div>
                  {plan.features && (
                    <ul className="mb-6 space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    className="w-full"
                    variant={plan.recommended ? "default" : "outline"}
                    disabled={hasActiveSubscription}
                    onClick={() => handlePurchase(plan.id)}
                  >
                    {hasActiveSubscription
                      ? t("Already Subscribed")
                      : t("Subscribe Now")}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
