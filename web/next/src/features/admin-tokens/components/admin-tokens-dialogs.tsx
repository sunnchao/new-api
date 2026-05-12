"use client";

import { AdminTokenDeleteDialog } from "./admin-token-delete-dialog";
import { AdminTokenFormDialog } from "./admin-token-form-dialog";

export function AdminTokensDialogs() {
  return (
    <>
      <AdminTokenFormDialog />
      <AdminTokenDeleteDialog />
    </>
  );
}
