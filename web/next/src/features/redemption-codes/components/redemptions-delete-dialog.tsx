"use client";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteRedemption } from "../api";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants";
import { useRedemptions } from "./redemptions-provider";

export function RedemptionsDeleteDialog() {
  const { t } = useTranslation();
  const { open, setOpen, currentRow, triggerRefresh } = useRedemptions();

  return (
    <ConfirmDialog
      open={open === "delete"}
      onOpenChange={(next) => !next && setOpen(null)}
      title={t("Delete Redemption Code?")}
      description={t("This action cannot be undone.")}
      confirmText={t("Delete")}
      cancelText={t("Cancel")}
      variant="destructive"
      onConfirm={async () => {
        if (!currentRow) return;
        const result = await deleteRedemption(currentRow.id);
        if (result.success) {
          toast.success(t(SUCCESS_MESSAGES.REDEMPTION_DELETED));
          triggerRefresh();
        } else {
          toast.error(result.message || t(ERROR_MESSAGES.DELETE_FAILED));
        }
      }}
    />
  );
}
