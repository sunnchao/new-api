"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const amount = params.get("amount");

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-[var(--success)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payment Successful</h1>
            <p className="text-sm text-[var(--muted)] mt-2">
              Your wallet has been topped up. Funds may take a moment to appear.
            </p>
          </div>
          {amount ? (
            <div className="mx-auto inline-flex items-baseline gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2">
              <span className="text-xs text-[var(--muted)]">Amount</span>
              <span className="font-mono font-semibold">${amount}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button onClick={() => router.push("/wallet")}>View Wallet</Button>
            <Button variant="outline" onClick={() => router.push("/wallet")}>
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WalletSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-10 w-10 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
