"use client";

import i18n from "@/i18n/config";
import { ThemeProvider } from "@/context/theme-provider";
import { ThemeCustomizationProvider } from "@/context/theme-customization-provider";
import { QueryProvider } from "@/context/query-provider";
import { checkSetupRequired, getStatus } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useSystemConfigStore, type QuotaDisplayType } from "@/stores/system-config-store";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function I18nLanguageProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("i18nextLng");
      const detected = stored || window.navigator.language;
      const lang = detected?.split("-")[0];
      const supported = ["en", "zh", "fr", "ru", "ja", "vi"];
      if (lang && supported.includes(lang) && i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
    } catch {
      // Fall back to the default language if localStorage/navigator is unavailable.
    }
  }, []);

  return children;
}

function AuthHydrationProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // Keep the persisted store state if localStorage is unavailable or malformed.
    }
  }, [setUser]);

  return children;
}

function getStringValue(data: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string") return value;
  }
  return undefined;
}

function getBooleanValue(data: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return undefined;
}

function getNumberValue(data: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function isQuotaDisplayType(value: unknown): value is QuotaDisplayType {
  return value === "USD" || value === "CNY" || value === "TOKENS" || value === "CUSTOM";
}

function SystemConfigProvider({ children }: { children: ReactNode }) {
  const setConfig = useSystemConfigStore((s) => s.setConfig);
  const setCurrency = useSystemConfigStore((s) => s.setCurrency);

  useEffect(() => {
    let cancelled = false;

    getStatus()
      .then((data) => {
        if (cancelled) return;

        const systemName = getStringValue(data, ["system_name", "SystemName", "systemName"]);
        const logo = getStringValue(data, ["logo", "Logo"]);
        const footerHtml = getStringValue(data, ["footer_html", "Footer", "footerHtml"]);
        const demoSiteEnabled = getBooleanValue(data, ["demo_site_enabled", "DemoSiteEnabled"]);
        const displayTokenStatEnabled = getBooleanValue(data, [
          "display_token_stat_enabled",
          "DisplayTokenStatEnabled",
        ]);

        setConfig({
          ...(systemName ? { systemName } : {}),
          ...(logo ? { logo } : {}),
          ...(footerHtml ? { footerHtml } : {}),
          ...(typeof demoSiteEnabled === "boolean" ? { demoSiteEnabled } : {}),
          ...(typeof displayTokenStatEnabled === "boolean" ? { displayTokenStatEnabled } : {}),
        });

        const quotaDisplayType = data.quota_display_type ?? data.QuotaDisplayType;
        const displayInCurrency = getBooleanValue(data, ["display_in_currency", "DisplayInCurrency"]);
        const quotaPerUnit = getNumberValue(data, ["quota_per_unit", "QuotaPerUnit"]);
        const usdExchangeRate = getNumberValue(data, ["usd_exchange_rate", "USDExchangeRate"]);
        const customCurrencySymbol = getStringValue(data, [
          "custom_currency_symbol",
          "CustomCurrencySymbol",
        ]);
        const customCurrencyExchangeRate = getNumberValue(data, [
          "custom_currency_exchange_rate",
          "CustomCurrencyExchangeRate",
        ]);

        setCurrency({
          ...(typeof displayInCurrency === "boolean"
            ? { displayInCurrency }
            : {}),
          ...(isQuotaDisplayType(quotaDisplayType) ? { quotaDisplayType } : {}),
          ...(typeof quotaPerUnit === "number"
            ? { quotaPerUnit }
            : {}),
          ...(typeof usdExchangeRate === "number"
            ? { usdExchangeRate }
            : {}),
          ...(customCurrencySymbol
            ? { customCurrencySymbol }
            : {}),
          ...(typeof customCurrencyExchangeRate === "number"
            ? { customCurrencyExchangeRate }
            : {}),
        });
      })
      .catch(() => {
        // System defaults and persisted values remain usable if status preload fails.
      });

    return () => {
      cancelled = true;
    };
  }, [setConfig, setCurrency]);

  return children;
}

function SetupGuardProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname === "/setup" || pathname.startsWith("/setup/")) return;

    let cancelled = false;
    checkSetupRequired().then((required) => {
      if (!cancelled && required) {
        window.location.replace("/setup");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return children;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeCustomizationProvider>
        <QueryProvider>
          <AuthHydrationProvider>
            <I18nLanguageProvider>
              <SetupGuardProvider>
                <SystemConfigProvider>
                  <TooltipProvider delayDuration={150}>
                    {children}
                  </TooltipProvider>
                  <Toaster richColors position="top-right" />
                </SystemConfigProvider>
              </SetupGuardProvider>
            </I18nLanguageProvider>
          </AuthHydrationProvider>
        </QueryProvider>
      </ThemeCustomizationProvider>
    </ThemeProvider>
  );
}
