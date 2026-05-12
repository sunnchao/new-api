"use client";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteAdminToken } from "../api";
import { useAdminTokens } from "./admin-tokens-provider";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/features/keys/constants";

export function AdminTokenDeleteDialog() {
  const { t } = useTranslation();
  const { open, setOpen, currentRow, triggerRefresh } = useAdminTokens();

  return (
    <ConfirmDialog
      open={open === "delete"}
      onOpenChange={(next) => !next && setOpen(null)}
      title={t("Delete Admin Token?")}
      description={t("This action cannot be undone.")}
      confirmText={t("Delete")}
      cancelText={t("Cancel")}
      variant="destructive"
      onConfirm={async () => {
        if (!currentRow) return;
        const result = await deleteAdminToken(currentRow.id);
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
