"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Crown, CreditCard, Check } from "lucide-react";

interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number;
  quota: number;
  status: number;
  features?: string[];
}

interface UserSubscription {
  id: number;
  plan_id: number;
  plan_name?: string;
  status: number;
  expired_time: number;
  created_time: number;
}

export default function SubscriptionsPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/subscription/plans").then((r) => {
        if (r.data?.data) setPlans(r.data.data);
      }),
      api.get("/api/subscription/self").then((r) => {
        if (r.data?.data) setSubscriptions(r.data.data);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId: number, method: string) => {
    try {
      const endpoint = `/api/subscription/${method}/pay`;
      const res = await api.post(endpoint, { plan_id: planId });
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      } else if (res.data?.success) {
        toast.success(t("common.success"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const formatPrice = (price: number) => `$${(price / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Subscriptions</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Subscriptions</h1>

      {/* Active subscriptions */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-[var(--accent)]" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)]/50">
                  <div>
                    <div className="font-medium">{sub.plan_name || `Plan #${sub.plan_id}`}</div>
                    <div className="text-xs text-[var(--muted)]">
                      Expires: {sub.expired_time ? new Date(sub.expired_time * 1000).toLocaleDateString() : "Never"}
                    </div>
                  </div>
                  <Badge variant={sub.status === 1 ? "success" : "secondary"}>
                    {sub.status === 1 ? "Active" : "Expired"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available plans */}
      <h2 className="text-lg font-semibold">Available Plans</h2>
      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-[var(--muted)]">
            No subscription plans available.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-[var(--accent)]" />
                  {plan.name}
                </CardTitle>
                {plan.description && (
                  <p className="text-sm text-[var(--muted)]">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="text-3xl font-bold font-mono mb-1">
                  {formatPrice(plan.price)}
                </div>
                <div className="text-xs text-[var(--muted)] mb-4">
                  per {plan.duration} days
                </div>
                <div className="text-sm mb-4">
                  {(plan.quota / 500000).toFixed(0)}$ quota included
                </div>
                {plan.features && (
                  <ul className="space-y-1 mb-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[var(--muted)]">
                        <Check className="h-3 w-3 text-[var(--success)]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto space-y-2">
                  <Button className="w-full" onClick={() => handleSubscribe(plan.id, "stripe")}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscribe with Stripe
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => handleSubscribe(plan.id, "balance")}>
                    Pay with Balance
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
