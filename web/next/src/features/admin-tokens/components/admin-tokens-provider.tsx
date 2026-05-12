"use client";

import * as React from "react";
import type { AdminToken, AdminTokensDialogType } from "../types";

type AdminTokensContextType = {
  open: AdminTokensDialogType | null;
  setOpen: (value: AdminTokensDialogType | null) => void;
  currentRow: AdminToken | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<AdminToken | null>>;
  refreshTrigger: number;
  triggerRefresh: () => void;
};

const AdminTokensContext = React.createContext<AdminTokensContextType | null>(null);

export function AdminTokensProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState<AdminTokensDialogType | null>(null);
  const [currentRow, setCurrentRow] = React.useState<AdminToken | null>(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const triggerRefresh = React.useCallback(() => setRefreshTrigger((prev) => prev + 1), []);

  return (
    <AdminTokensContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow, refreshTrigger, triggerRefresh }}
    >
      {children}
    </AdminTokensContext.Provider>
  );
}

export function useAdminTokens() {
  const context = React.useContext(AdminTokensContext);
  if (!context) {
    throw new Error("useAdminTokens must be used within <AdminTokensProvider>");
  }
  return context;
}
