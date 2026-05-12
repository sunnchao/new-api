"use client";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteApiKey } from "../api";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants";
import { useApiKeys } from "./api-keys-provider";

export function ApiKeysDeleteDialog() {
  const { t } = useTranslation();
  const { open, setOpen, currentRow, triggerRefresh } = useApiKeys();

  return (
    <ConfirmDialog
      open={open === "delete"}
      onOpenChange={(next) => !next && setOpen(null)}
      title={t("Delete API Key?")}
      description={t("This action cannot be undone.")}
      confirmText={t("Delete")}
      cancelText={t("Cancel")}
      variant="destructive"
      onConfirm={async () => {
        if (!currentRow) return;
        const result = await deleteApiKey(currentRow.id);
        if (result.success) {
          toast.success(t(SUCCESS_MESSAGES.API_KEY_DELETED));
          triggerRefresh();
        } else {
          toast.error(result.message || t(ERROR_MESSAGES.DELETE_FAILED));
        }
      }}
    />
  );
}
