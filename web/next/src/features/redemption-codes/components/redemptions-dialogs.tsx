"use client";

import { CreatedCodesDialog } from "./created-codes-dialog";
import { RedemptionFormDialog } from "./redemption-form-dialog";
import { RedemptionsDeleteDialog } from "./redemptions-delete-dialog";

export function RedemptionsDialogs() {
  return (
    <>
      <RedemptionFormDialog />
      <RedemptionsDeleteDialog />
      <CreatedCodesDialog />
    </>
  );
}
