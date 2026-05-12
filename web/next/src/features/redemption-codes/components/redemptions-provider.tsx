"use client";

import * as React from "react";
import type { Redemption, RedemptionsDialogType } from "../types";

type RedemptionsContextType = {
  open: RedemptionsDialogType | null;
  setOpen: (value: RedemptionsDialogType | null) => void;
  currentRow: Redemption | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Redemption | null>>;
  refreshTrigger: number;
  triggerRefresh: () => void;
  createdCodes: string[];
  setCreatedCodes: React.Dispatch<React.SetStateAction<string[]>>;
};

const RedemptionsContext = React.createContext<RedemptionsContextType | null>(null);

export function RedemptionsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState<RedemptionsDialogType | null>(null);
  const [currentRow, setCurrentRow] = React.useState<Redemption | null>(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [createdCodes, setCreatedCodes] = React.useState<string[]>([]);
  const triggerRefresh = React.useCallback(() => setRefreshTrigger((prev) => prev + 1), []);

  return (
    <RedemptionsContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        refreshTrigger,
        triggerRefresh,
        createdCodes,
        setCreatedCodes,
      }}
    >
      {children}
    </RedemptionsContext.Provider>
  );
}

export function useRedemptions() {
  const context = React.useContext(RedemptionsContext);
  if (!context) {
    throw new Error("useRedemptions must be used within <RedemptionsProvider>");
  }
  return context;
}
