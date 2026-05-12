import { create } from "zustand";
import { persist } from "zustand/middleware";

export type QuotaDisplayType = "USD" | "CNY" | "TOKENS" | "CUSTOM";

export interface CurrencyConfig {
  displayInCurrency: boolean;
  quotaDisplayType: QuotaDisplayType;
  quotaPerUnit: number;
  usdExchangeRate: number;
  customCurrencySymbol?: string;
  customCurrencyExchangeRate?: number;
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
  setConfig: (config: Partial<SystemConfig>) => void;
  setCurrency: (currency: Partial<CurrencyConfig>) => void;
  setLoadedLogoUrl: (url: string) => void;
  getSystemName: () => string;
  getLogo: () => string;
  getFooterHtml: () => string;
}

const defaultCurrency: CurrencyConfig = {
  displayInCurrency: true,
  quotaDisplayType: "USD",
  quotaPerUnit: 500000,
  usdExchangeRate: 1,
};

const defaultConfig: SystemConfig = {
  systemName: "New API",
  logo: "",
  footerHtml: "",
  demoSiteEnabled: false,
  displayTokenStatEnabled: false,
  currency: defaultCurrency,
};

export const useSystemConfigStore = create<SystemConfigState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      loadedLogoUrl: "",
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
      getSystemName: () => get().config.systemName || "New API",
      getLogo: () => get().config.logo || get().loadedLogoUrl,
      getFooterHtml: () => get().config.footerHtml,
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
