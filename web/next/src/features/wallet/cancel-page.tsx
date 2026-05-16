"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function WalletCancelPage() {
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/wallet"), 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-2xl font-bold">{t("Payment Cancelled")}</h1>
      <p className="text-muted-foreground mt-2">{t("Redirecting to wallet...")}</p>
    </div>
  );
}
