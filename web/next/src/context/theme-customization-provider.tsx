"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type ThemePreset = "default" | "blue" | "violet" | "teal" | "rose" | "amber";
export type ThemeRadius = "sharp" | "small" | "medium" | "large";
export type ThemeScale = "compact" | "default" | "comfortable";
export type ContentLayout = "full" | "centered";

interface ThemeCustomization {
  preset: ThemePreset;
  radius: ThemeRadius;
  scale: ThemeScale;
  contentLayout: ContentLayout;
}

interface ThemeCustomizationContextValue {
  customization: ThemeCustomization;
  setPreset: (preset: ThemePreset) => void;
  setRadius: (radius: ThemeRadius) => void;
  setScale: (scale: ThemeScale) => void;
  setContentLayout: (layout: ContentLayout) => void;
  reset: () => void;
}

const STORAGE_KEY = "theme-customization";

const DEFAULT_CUSTOMIZATION: ThemeCustomization = {
  preset: "default",
  radius: "medium",
  scale: "default",
  contentLayout: "full",
};

const ThemeCustomizationContext = createContext<ThemeCustomizationContextValue | undefined>(undefined);

function readStored(): ThemeCustomization {
  if (typeof window === "undefined") return DEFAULT_CUSTOMIZATION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMIZATION;
    const parsed = JSON.parse(raw) as Partial<ThemeCustomization>;
    return { ...DEFAULT_CUSTOMIZATION, ...parsed };
  } catch {
    return DEFAULT_CUSTOMIZATION;
  }
}

function applyToDocument(c: ThemeCustomization) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme-preset", c.preset);
  root.setAttribute("data-theme-radius", c.radius);
  root.setAttribute("data-theme-scale", c.scale);
  root.setAttribute("data-theme-content-layout", c.contentLayout);
}

export function ThemeCustomizationProvider({ children }: { children: ReactNode }) {
  const [customization, setCustomization] = useState<ThemeCustomization>(DEFAULT_CUSTOMIZATION);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const next = readStored();
    setCustomization(next);
    applyToDocument(next);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyToDocument(customization);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customization));
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }, [customization, hydrated]);

  const setPreset = useCallback((preset: ThemePreset) => {
    setCustomization((prev) => ({ ...prev, preset }));
  }, []);

  const setRadius = useCallback((radius: ThemeRadius) => {
    setCustomization((prev) => ({ ...prev, radius }));
  }, []);

  const setScale = useCallback((scale: ThemeScale) => {
    setCustomization((prev) => ({ ...prev, scale }));
  }, []);

  const setContentLayout = useCallback((contentLayout: ContentLayout) => {
    setCustomization((prev) => ({ ...prev, contentLayout }));
  }, []);

  const reset = useCallback(() => {
    setCustomization(DEFAULT_CUSTOMIZATION);
  }, []);

  return (
    <ThemeCustomizationContext.Provider
      value={{ customization, setPreset, setRadius, setScale, setContentLayout, reset }}
    >
      {children}
    </ThemeCustomizationContext.Provider>
  );
}

export function useThemeCustomization() {
  const ctx = useContext(ThemeCustomizationContext);
  if (!ctx) {
    throw new Error("useThemeCustomization must be used within a ThemeCustomizationProvider");
  }
  return ctx;
}
