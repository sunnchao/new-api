"use client";

import { useTranslation } from "react-i18next";
import { AdminTokensDialogs } from "./components/admin-tokens-dialogs";
import { AdminTokensProvider } from "./components/admin-tokens-provider";
import { AdminTokensTable } from "./components/admin-tokens-table";

export function AdminTokensPage() {
  const { t } = useTranslation();

  return (
    <AdminTokensProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("Token Management")}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t("Create and manage user-owned API keys from the admin console.")}
          </p>
        </div>
        <AdminTokensTable />
      </div>
      <AdminTokensDialogs />
    </AdminTokensProvider>
  );
}
