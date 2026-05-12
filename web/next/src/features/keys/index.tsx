"use client";

import { useTranslation } from "react-i18next";
import { ApiKeysDialogs } from "./components/api-keys-dialogs";
import { ApiKeysProvider } from "./components/api-keys-provider";
import { ApiKeysTable } from "./components/api-keys-table";

export function KeysPage() {
  const { t } = useTranslation();

  return (
    <ApiKeysProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("API Keys")}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t("Manage your API keys for accessing the service")}
          </p>
        </div>
        <ApiKeysTable />
      </div>
      <ApiKeysDialogs />
    </ApiKeysProvider>
  );
}
