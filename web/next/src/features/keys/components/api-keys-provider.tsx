"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { fetchTokenKey, fetchTokenKeysBatch } from "../api";
import { ERROR_MESSAGES } from "../constants";
import type { ApiKey, ApiKeysDialogType } from "../types";

type ApiKeysContextType = {
  open: ApiKeysDialogType | null;
  setOpen: (value: ApiKeysDialogType | null) => void;
  currentRow: ApiKey | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<ApiKey | null>>;
  refreshTrigger: number;
  triggerRefresh: () => void;
  resolveRealKey: (id: number) => Promise<string | null>;
  resolveRealKeysBatch: (ids: number[]) => Promise<Record<number, string>>;
  resolvedKeys: Record<number, string>;
  loadingKeys: Record<number, boolean>;
  copiedKeyId: number | null;
  markKeyCopied: (id: number) => void;
};

const ApiKeysContext = React.createContext<ApiKeysContextType | null>(null);

export function ApiKeysProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState<ApiKeysDialogType | null>(null);
  const [currentRow, setCurrentRow] = React.useState<ApiKey | null>(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [resolvedKeys, setResolvedKeys] = React.useState<Record<number, string>>({});
  const [loadingKeys, setLoadingKeys] = React.useState<Record<number, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = React.useState<number | null>(null);
  const pendingRequests = React.useRef<Record<number, Promise<string | null>>>({});
  const copiedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const triggerRefresh = React.useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const markKeyCopied = React.useCallback((id: number) => {
    setCopiedKeyId(id);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedKeyId(null), 2000);
  }, []);

  const resolveRealKey = React.useCallback(
    async (id: number): Promise<string | null> => {
      if (resolvedKeys[id]) return resolvedKeys[id];
      if (id in pendingRequests.current) return pendingRequests.current[id];

      const request = (async () => {
        setLoadingKeys((prev) => ({ ...prev, [id]: true }));
        try {
          const res = await fetchTokenKey(id);
          if (res.success && res.data?.key) {
            const fullKey = `sk-${res.data.key}`;
            setResolvedKeys((prev) => ({ ...prev, [id]: fullKey }));
            return fullKey;
          }
          toast.error(res.message || t(ERROR_MESSAGES.UNEXPECTED));
          return null;
        } catch {
          toast.error(t(ERROR_MESSAGES.UNEXPECTED));
          return null;
        } finally {
          delete pendingRequests.current[id];
          setLoadingKeys((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      })();

      pendingRequests.current[id] = request;
      return request;
    },
    [resolvedKeys, t],
  );

  const resolveRealKeysBatch = React.useCallback(
    async (ids: number[]): Promise<Record<number, string>> => {
      const uncachedIds = ids.filter((id) => !resolvedKeys[id]);
      if (uncachedIds.length === 0) {
        return Object.fromEntries(ids.map((id) => [id, resolvedKeys[id]]));
      }

      for (const id of uncachedIds) {
        setLoadingKeys((prev) => ({ ...prev, [id]: true }));
      }

      try {
        const res = await fetchTokenKeysBatch(uncachedIds);
        if (res.success && res.data?.keys) {
          const newKeys: Record<number, string> = {};
          for (const [id, key] of Object.entries(res.data.keys)) {
            newKeys[Number(id)] = `sk-${key}`;
          }
          setResolvedKeys((prev) => ({ ...prev, ...newKeys }));
          return Object.fromEntries(ids.map((id) => [id, resolvedKeys[id] || newKeys[id]]));
        }
        toast.error(res.message || t(ERROR_MESSAGES.UNEXPECTED));
        return {};
      } catch {
        toast.error(t(ERROR_MESSAGES.UNEXPECTED));
        return {};
      } finally {
        for (const id of uncachedIds) {
          setLoadingKeys((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      }
    },
    [resolvedKeys, t],
  );

  return (
    <ApiKeysContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        refreshTrigger,
        triggerRefresh,
        resolveRealKey,
        resolveRealKeysBatch,
        resolvedKeys,
        loadingKeys,
        copiedKeyId,
        markKeyCopied,
      }}
    >
      {children}
    </ApiKeysContext.Provider>
  );
}

export function useApiKeys() {
  const context = React.useContext(ApiKeysContext);
  if (!context) {
    throw new Error("useApiKeys must be used within <ApiKeysProvider>");
  }
  return context;
}
