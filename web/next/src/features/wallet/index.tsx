"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useSystemConfigStore } from "@/stores/system-config-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet as WalletIcon, Gift, CreditCard, ArrowDownUp, Receipt, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WalletPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.auth.user);
  const setUser = useAuthStore((s) => s.setUser);
  const currency = useSystemConfigStore((s) => s.config.currency);
  const router = useRouter();
  const [topupCode, setTopupCode] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [affCode, setAffCode] = useState("");
  const [affLoading, setAffLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const formatQuota = (quota: number) => {
    if (currency.quotaDisplayType === "TOKENS") return `${(quota / 1).toLocaleString()} tokens`;
    const val = quota / currency.quotaPerUnit * (currency.usdExchangeRate || 1);
    if (currency.quotaDisplayType === "CNY") return `¥${val.toFixed(2)}`;
    if (currency.quotaDisplayType === "CUSTOM") return `${currency.customCurrencySymbol || ""}${val.toFixed(2)}`;
    return `$${val.toFixed(2)}`;
  };

  useEffect(() => {
    api.get("/api/user/topup/self").then((res) => {
      if (res.data?.data) setHistory(res.data.data);
    }).finally(() => setHistoryLoading(false));
  }, []);

  const handleTopup = async () => {
    if (!topupCode.trim()) return;
    setTopupLoading(true);
    try {
      const res = await api.post("/api/user/topup", { key: topupCode.trim() });
      if (res.data?.success) {
        toast.success(t("common.success"));
        setTopupCode("");
        // Refresh user
        const selfRes = await api.get("/api/user/self");
        if (selfRes.data?.data) setUser(selfRes.data.data);
      } else {
        toast.error(res.data?.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setTopupLoading(false);
    }
  };

  const handleAffTransfer = async () => {
    if (!affCode.trim()) return;
    setAffLoading(true);
    try {
      const res = await api.post("/api/user/aff_transfer", { aff_code: affCode.trim() });
      if (res.data?.success) {
        toast.success(t("common.success"));
        setAffCode("");
      } else {
        toast.error(res.data?.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setAffLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("nav.wallet")}</h1>

      {/* Balance card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-[var(--muted)]">{t("common.balance")}</CardTitle>
          <WalletIcon className="h-5 w-5 text-[var(--accent)]" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono">
            {user ? formatQuota(user.quota - user.used_quota) : "—"}
          </div>
          <div className="flex gap-4 mt-3 text-sm text-[var(--muted)]">
            <span>{t("dashboard.totalQuota")}: {user ? formatQuota(user.quota) : "—"}</span>
            <span>{t("dashboard.usedQuota")}: {user ? formatQuota(user.used_quota) : "—"}</span>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => router.push("/wallet/topup")}>
              <DollarSign className="h-4 w-4 mr-2" />
              Top Up
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push("/subscriptions")}>
              <CreditCard className="h-4 w-4 mr-2" />
              Subscribe
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push("/invoices")}>
              <Receipt className="h-4 w-4 mr-2" />
              Invoices
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top up */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-4 w-4 text-[var(--accent)]" />
              Redeem Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={topupCode}
                onChange={(e) => setTopupCode(e.target.value)}
                placeholder="Enter redemption code"
              />
              <Button onClick={handleTopup} disabled={topupLoading}>
                {topupLoading ? t("common.loading") : "Redeem"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Affiliate transfer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4 text-[var(--accent)]" />
              Affiliate Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.aff_code && (
              <div className="mb-3">
                <Label className="text-xs text-[var(--muted)]">Your Code</Label>
                <div className="font-mono text-sm">{user.aff_code}</div>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={affCode}
                onChange={(e) => setAffCode(e.target.value)}
                placeholder="Enter affiliate code"
              />
              <Button onClick={handleAffTransfer} disabled={affLoading} variant="outline">
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-[var(--surface)] rounded animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-8">{t("common.noData")}</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 20).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <span className="text-sm">{item.type === 1 ? "Top-up" : item.type === 2 ? "Subscription" : "System"}</span>
                    <span className="text-xs text-[var(--muted)] ml-2">
                      {item.created_time ? new Date(item.created_time * 1000).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <span className={`font-mono text-sm ${item.amount >= 0 ? "text-[var(--success)]" : "text-[var(--destructive)]"}`}>
                    {item.amount >= 0 ? "+" : ""}{formatQuota(Math.abs(item.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
