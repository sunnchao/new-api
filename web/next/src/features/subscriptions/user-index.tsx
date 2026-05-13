"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Crown, CreditCard, Check } from "lucide-react";
import { getPublicPlans, getSelfSubscriptionFull, paySubscriptionStripe, paySubscriptionBalance } from "./api";
import type { PlanRecord, UserSubscriptionRecord, SelfSubscriptionData } from "./types";

export default function UserSubscriptionsPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPublicPlans().then((res) => { if (res.data) setPlans(res.data); }),
      getSelfSubscriptionFull().then((res) => {
        const d = res.data as SelfSubscriptionData | UserSubscriptionRecord[] | undefined;
        if (d && "subscriptions" in d) {
          setSubscriptions(d.subscriptions || []);
        } else if (Array.isArray(d)) {
          setSubscriptions(d);
        }
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId: number, method: "stripe" | "balance") => {
    try {
      const res = method === "stripe"
        ? await paySubscriptionStripe({ plan_id: planId })
        : await paySubscriptionBalance({ plan_id: planId });
      const url = res.data?.pay_link || res.data?.checkout_url || res.url;
      if (url) {
        window.location.href = url;
      } else if (res.success) {
        toast.success(t("common.success", { defaultValue: "Success" }));
        // Refresh subscriptions
        const r = await getSelfSubscriptionFull();
        const d = r.data as SelfSubscriptionData | UserSubscriptionRecord[] | undefined;
        if (d && "subscriptions" in d) setSubscriptions(d.subscriptions || []);
        else if (Array.isArray(d)) setSubscriptions(d);
      }
    } catch {
      // error handled by api interceptor
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Crown className="h-6 w-6 text-[var(--accent)]" />{t("subscriptions.mySubscriptions", { defaultValue: "My Subscriptions" })}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Crown className="h-6 w-6 text-[var(--accent)]" />
        {t("subscriptions.mySubscriptions", { defaultValue: "My Subscriptions" })}
      </h1>

      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-[var(--accent)]" />
              {t("subscriptions.active", { defaultValue: "Active Subscriptions" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscriptions.map(({ subscription: sub }) => {
              const progress = sub.amount_total > 0 ? (sub.amount_used / sub.amount_total) * 100 : 0;
              const isActive = sub.status === "active" && sub.end_time * 1000 > Date.now();
              return (
                <div key={sub.id} className="p-4 rounded-lg bg-[var(--surface)]/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Plan #{sub.plan_id}</div>
                    <Badge variant={isActive ? "default" : "secondary"}>{sub.status}</Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-[var(--muted)]">
                    <span>{(sub.amount_used / 500000).toFixed(2)}$ / {(sub.amount_total / 500000).toFixed(2)}$</span>
                    <span>{t("subscriptions.expires", { defaultValue: "Expires" })}: {new Date(sub.end_time * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <h2 className="text-lg font-semibold">{t("subscriptions.availablePlans", { defaultValue: "Available Plans" })}</h2>
      {plans.length === 0 ? (
        <Card><CardContent className="text-center py-12 text-[var(--muted)]">{t("subscriptions.noPlans", { defaultValue: "No subscription plans available." })}</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(({ plan }) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-[var(--accent)]" />
                  {plan.title}
                </CardTitle>
                {plan.subtitle && <p className="text-sm text-[var(--muted)]">{plan.subtitle}</p>}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="text-3xl font-bold font-mono mb-1">{plan.price_amount} {plan.currency || "USD"}</div>
                <div className="text-xs text-[var(--muted)] mb-4">/ {plan.duration_value} {plan.duration_unit}</div>
                <div className="text-sm mb-2">{(plan.total_amount / 500000).toFixed(0)}$ {t("subscriptions.quotaIncluded", { defaultValue: "quota included" })}</div>
                {plan.quota_reset_period !== "never" && (
                  <div className="text-xs text-[var(--muted)] mb-2 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {t("subscriptions.resetsEvery", { defaultValue: "Resets" })} {plan.quota_reset_period}
                  </div>
                )}
                {plan.upgrade_group && (
                  <div className="text-xs text-[var(--muted)] mb-4 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {t("subscriptions.group", { defaultValue: "Group" })}: {plan.upgrade_group}
                  </div>
                )}
                <div className="mt-auto space-y-2">
                  <Button className="w-full" onClick={() => handleSubscribe(plan.id, "stripe")}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t("subscriptions.payStripe", { defaultValue: "Pay with Stripe" })}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => handleSubscribe(plan.id, "balance")}>
                    {t("subscriptions.payBalance", { defaultValue: "Pay with Balance" })}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
