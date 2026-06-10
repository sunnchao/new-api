import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CurrencyDisplayType = "USD" | "CNY" | "TOKENS" | "CUSTOM";

/** @deprecated Use CurrencyDisplayType instead */
export type QuotaDisplayType = CurrencyDisplayType;

export interface CurrencyConfig {
  displayInCurrency: boolean;
  quotaDisplayType: CurrencyDisplayType;
  quotaPerUnit: number;
  usdExchangeRate: number;
  customCurrencySymbol: string;
  customCurrencyExchangeRate: number;
}

export interface SystemConfig {
  systemName: string;
  logo: string;
  footerHtml: string;
  demoSiteEnabled: boolean;
  displayTokenStatEnabled: boolean;
  currency: CurrencyConfig;
}

interface SystemConfigState {
  config: SystemConfig;
  loadedLogoUrl: string;
  loading: boolean;
  setConfig: (config: Partial<SystemConfig>) => void;
  setCurrency: (currency: Partial<CurrencyConfig>) => void;
  setLoadedLogoUrl: (url: string) => void;
  setLoading: (loading: boolean) => void;
  getSystemName: () => string;
  getLogo: () => string;
  getFooterHtml: () => string;
}

export const DEFAULT_CURRENCY_CONFIG: CurrencyConfig = {
  displayInCurrency: true,
  quotaDisplayType: "USD",
  quotaPerUnit: 500000,
  usdExchangeRate: 1,
  customCurrencySymbol: "¤",
  customCurrencyExchangeRate: 1,
};

const defaultConfig: SystemConfig = {
  systemName: "New API",
  logo: "",
  footerHtml: "",
  demoSiteEnabled: false,
  displayTokenStatEnabled: false,
  currency: { ...DEFAULT_CURRENCY_CONFIG },
};

export const useSystemConfigStore = create<SystemConfigState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      loadedLogoUrl: "",
      loading: false,
      setConfig: (partial) =>
        set((s) => ({ config: { ...s.config, ...partial } })),
      setCurrency: (partial) =>
        set((s) => ({
          config: {
            ...s.config,
            currency: { ...s.config.currency, ...partial },
          },
        })),
      setLoadedLogoUrl: (url) => set({ loadedLogoUrl: url }),
      setLoading: (loading) => set({ loading }),
      getSystemName: () => get().config.systemName || "New API",
      getLogo: () => get().config.logo || get().loadedLogoUrl,
      getFooterHtml: () => get().config.footerHtml || "",
    }),
    {
      name: "system-config-storage",
      partialize: (state) => ({
        config: state.config,
        loadedLogoUrl: state.loadedLogoUrl,
      }),
    }
  )
);
