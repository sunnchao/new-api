"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function WalletCancelPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-[var(--destructive)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payment Cancelled</h1>
            <p className="text-sm text-[var(--muted)] mt-2">
              The payment was cancelled. No charges were made to your account.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button onClick={() => router.push("/wallet/topup")}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/wallet")}>
              Back to Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
