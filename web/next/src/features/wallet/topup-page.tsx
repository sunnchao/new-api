"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";
import { useSystemConfigStore } from "@/stores/system-config-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CreditCard,
  DollarSign,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type PayMethod = "stripe" | "epay" | "creem" | "waffo";

interface MethodDef {
  id: PayMethod;
  label: string;
  description: string;
}

const METHODS: MethodDef[] = [
  { id: "stripe", label: "Stripe", description: "Credit / debit card via Stripe" },
  { id: "epay", label: "Epay", description: "Alipay / WeChat / UnionPay" },
  { id: "creem", label: "Creem", description: "Creem global checkout" },
  { id: "waffo", label: "Waffo", description: "Waffo wallet gateway" },
];

const PRESETS = [5, 10, 20, 50, 100];

export default function TopupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const currency = useSystemConfigStore((s) => s.config.currency);

  const [amount, setAmount] = useState<string>("10");
  const [method, setMethod] = useState<PayMethod>("stripe");
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<{ amount: number; price: number } | null>(null);

  const numericAmount = Number(amount);
  const isValidAmount = Number.isFinite(numericAmount) && numericAmount > 0;

  const formatQuota = (quota: number) => {
    const val = (quota / 500000).toFixed(2);
    if (currency.quotaDisplayType === "CNY")
      return `¥${(Number(val) * (currency.usdExchangeRate || 1)).toFixed(2)}`;
    if (currency.quotaDisplayType === "CUSTOM")
      return `${currency.customCurrencySymbol || ""}${(
        Number(val) * (currency.customCurrencyExchangeRate || 1)
      ).toFixed(2)}`;
    if (currency.quotaDisplayType === "TOKENS")
      return `${quota.toLocaleString()} tokens`;
    return `$${val}`;
  };

  const estimatedQuota = isValidAmount ? numericAmount * 500000 : 0;

  const amountEndpoint =
    method === "stripe" ? "/api/user/stripe/amount" : "/api/user/amount";
  const payEndpoint =
    method === "stripe" ? "/api/user/stripe/pay" : "/api/user/pay";

  const fetchQuote = async () => {
    if (!isValidAmount) {
      toast.error("Enter a valid amount");
      return null;
    }
    setQuoteLoading(true);
    try {
      const res = await api.post(amountEndpoint, {
        amount: numericAmount,
        payment_method: method,
        top_up_code: "",
      });
      if (res.data?.success && res.data?.data) {
        const q = {
          amount: res.data.data.amount,
          price: res.data.data.price,
        };
        setQuote(q);
        return q;
      }
      toast.error(res.data?.message || "Failed to get quote");
      return null;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to get quote");
      return null;
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValidAmount) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const q = quote ?? (await fetchQuote());
      if (!q) {
        setLoading(false);
        return;
      }
      const res = await api.post(payEndpoint, {
        amount: numericAmount,
        payment_method: method,
        top_up_code: "",
      });
      if (res.data?.success) {
        const url =
          res.data?.data?.url ||
          res.data?.data?.pay_url ||
          res.data?.data?.redirect_url ||
          res.data?.url;
        if (url) {
          window.location.href = url;
          return;
        }
        toast.success("Payment created");
      } else {
        toast.error(res.data?.message || "Payment failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Top Up</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Add funds to your wallet using your preferred payment method.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[var(--accent)]" />
            Amount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount" className="text-xs text-[var(--muted)]">
              USD amount
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">
                $
              </span>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setQuote(null);
                }}
                className="pl-7 font-mono"
                placeholder="10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={String(p) === amount ? "default" : "outline"}
                onClick={() => {
                  setAmount(String(p));
                  setQuote(null);
                }}
              >
                ${p}
              </Button>
            ))}
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--muted)]">Estimated quota</span>
            <span className="font-mono font-medium">
              {isValidAmount ? formatQuota(estimatedQuota) : "—"}
            </span>
          </div>
          {quote && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Quoted price</span>
              <span className="font-mono font-medium">
                ${quote.price.toFixed(2)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[var(--accent)]" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {METHODS.map((m) => {
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMethod(m.id);
                    setQuote(null);
                  }}
                  className={`text-left rounded-lg border p-4 transition-colors ${
                    active
                      ? "border-[var(--accent)] bg-[var(--surface)]"
                      : "border-[var(--border)] hover:border-[var(--accent)]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{m.label}</span>
                    {active ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Select
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {m.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.push("/wallet")}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={fetchQuote}
          disabled={loading || quoteLoading || !isValidAmount}
        >
          {quoteLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Refresh Quote
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !isValidAmount}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          Pay
          {isValidAmount ? ` $${numericAmount}` : ""}
        </Button>
      </div>
    </div>
  );
}
