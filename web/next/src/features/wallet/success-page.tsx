"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function WalletSuccessPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount");

  useEffect(() => {
    const timer = setTimeout(() => router.push("/wallet"), 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-2xl font-bold">{t("Payment Successful")}</h1>
      {amount && <p className="text-muted-foreground mt-2">{t("Amount")}: {amount}</p>}
      <p className="text-muted-foreground mt-2">{t("Redirecting to wallet...")}</p>
    </div>
  );
}
