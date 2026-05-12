"use client";

import { useTranslation } from "react-i18next";
import { RedemptionsDialogs } from "./components/redemptions-dialogs";
import { RedemptionsProvider } from "./components/redemptions-provider";
import { RedemptionsTable } from "./components/redemptions-table";

export function RedemptionCodesPage() {
  const { t } = useTranslation();

  return (
    <RedemptionsProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("Redemption Codes")}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t("Manage redemption codes for quota top-up")}
          </p>
        </div>
        <RedemptionsTable />
      </div>
      <RedemptionsDialogs />
    </RedemptionsProvider>
  );
}
