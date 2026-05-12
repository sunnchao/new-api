"use client";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRedemptions } from "./redemptions-provider";

export function CreatedCodesDialog() {
  const { t } = useTranslation();
  const { createdCodes, setCreatedCodes } = useRedemptions();
  const open = createdCodes.length > 0;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && setCreatedCodes([])}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Codes Created")}</DialogTitle>
          <DialogDescription>
            {t("Copy these codes now. They may not be shown again.")}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto py-2">
          {createdCodes.map((code) => (
            <div
              key={code}
              className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)]/40 px-3 py-2"
            >
              <code className="min-w-0 flex-1 truncate font-mono text-xs">{code}</code>
              <CopyButton value={code} size="sm" tooltip={t("Copy code")} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={async () => {
              if (await copyToClipboard(createdCodes.join("\n"))) {
                toast.success(t("Copied"));
              }
            }}
          >
            {t("Copy all")}
          </Button>
          <Button onClick={() => setCreatedCodes([])}>{t("Close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
