"use client";

import { ApiKeyFormDialog } from "./api-key-form-dialog";
import { ApiKeysDeleteDialog } from "./api-keys-delete-dialog";

export function ApiKeysDialogs() {
  return (
    <>
      <ApiKeyFormDialog />
      <ApiKeysDeleteDialog />
    </>
  );
}
